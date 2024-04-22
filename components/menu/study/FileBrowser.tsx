import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Tab } from "@headlessui/react";
import classNames from "classnames";
import useCollections from "@/hooks/useCollections";
import type Collection from "@/lib/db/entities/Collection";
import type Analysis from "@/lib/db/entities/Analysis";
import { Disclosure } from "@headlessui/react";
import { MdExpandMore, MdSearch } from "react-icons/md";
import { AiFillFile } from "react-icons/ai";

import { BsFillCollectionFill, BsFillShareFill } from "react-icons/bs";
import { IoMdMore } from "react-icons/io";
import { useRouter } from "next/router";
import { ScrollContainer } from "../../layout/GameLayout";
import useDebounce from "@/hooks/utils/useDebounce";
import useAnalysisSearch from "@/hooks/queries/useAnalysisSearch";
import { useInView } from "react-intersection-observer";
import { useContextMenu, Item, ItemParams, Menu } from "react-contexify";
import ConfirmationDialog from "../../dialogs/ConfirmationDialog";
import useFileManager, { FileManager } from "@/hooks/useFileManager";
import RenameDialog from "../../dialogs/RenameDialog";
import CollectionsDialog from "../../dialogs/CollectionsDialog";
import { HiSortDescending, HiSortAscending } from "react-icons/hi";
import Loading from "../../base/Loading";
import cn from "@/util/cn";
const Portal = ({ children }: { children: JSX.Element | string | Array<JSX.Element | string> }) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  return mounted ? createPortal(children, document.body) : null;
};

interface ItemProps {
  analysis: Analysis;
}

interface CollectionMenuProps {
  showDialog: (args: { analysisId: string; dialog: DialogKey }) => void;
  fileManager: FileManager;
}
export function CollectionMenu({ showDialog, fileManager }: CollectionMenuProps) {
  function handleItemClick({ id, event, props }: ItemParams<{ collection: Collection }>) {
    switch (id) {
      case "rename":
        if (props) showDialog({ analysisId: props.collection.id, dialog: "rename" });
        break;
      case "delete":
        if (props) showDialog({ analysisId: props.collection.id, dialog: "delete" });
        break;
    }
  }
  return (
    <Menu id="collection-context-menu" theme="dark">
      <Item id="rename" onClick={handleItemClick}>
        Rename
      </Item>
      <Item id="delete" onClick={handleItemClick}>
        Delete
      </Item>
    </Menu>
  );
}

interface FileMenuProps {
  showDialog: (args: { analysisId: string; dialog: DialogKey }) => void;
  fileManager: FileManager;
}
export function FileMenu({ showDialog, fileManager }: FileMenuProps) {
  const router = useRouter();
  function handleItemClick({ id, event, props }: ItemParams<ItemProps>) {
    switch (id) {
      case "open":
        if (props) router.push(`/study/analyze?id=${props.analysis.id}`);
        break;
      case "rename":
        if (props) showDialog({ analysisId: props.analysis.id, dialog: "rename" });
        break;
      // case "export":
      //   console.log("export");
      //   break;
      // case "share":
      //   console.log("share");
      //   break;
      case "delete":
        if (props) showDialog({ analysisId: props.analysis.id, dialog: "delete" });
        break;
      case "duplicate":
        if (props) {
          fileManager.forkAnalysis(props.analysis.id);
        }
        break;
      case "collections":
        if (props) showDialog({ analysisId: props.analysis.id, dialog: "collections" });
        break;
    }
  }
  return (
    <Menu id="file-context-menu" theme="dark">
      <Item id="open" onClick={handleItemClick}>
        Open
      </Item>
      <Item id="rename" onClick={handleItemClick}>
        Rename
      </Item>
      {/* <Item id="export" onClick={handleItemClick}>
        Export
      </Item> */}
      {/* <Item id="share" onClick={handleItemClick}>
        Share
      </Item> */}
      <Item id="delete" onClick={handleItemClick}>
        Delete
      </Item>
      <Item id="duplicate" onClick={handleItemClick}>
        Duplicate
      </Item>
      <Item id="collections" onClick={handleItemClick}>
        Manage Collections
      </Item>
    </Menu>
  );
}
function RenderCollection({ collection, refetch }: { collection: Collection; refetch: () => void }) {
  return (
    <StyledDiclosure label={collection.title} size={collection.analyses.length}>
      <AnalysisList analyses={collection.analyses} refetch={refetch} hideLastUpdate />
    </StyledDiclosure>
  );
}

interface ListProps {
  analyses: Analysis[];
  refetch: () => void;
  hideLastUpdate?: boolean;
}
type DialogKey = "delete" | "rename" | "export" | "collections";
function AnalysisList({ analyses, refetch, hideLastUpdate }: ListProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const showDeleteDialog = (analysisId: string) => {
    setSelected(analysisId);
    setDeleteDialogOpen(true);
  };
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const showRenameDialog = (analysisId: string) => {
    setSelected(analysisId);
    setRenameDialogOpen(true);
  };
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const showExportDialog = (analysisId: string) => {
    setSelected(analysisId);
    setExportDialogOpen(true);
  };
  const [collectionsDialogOpen, setCollectionsDialogOpen] = useState(false);
  const showCollectionsDialog = (analysisId: string) => {
    setSelected(analysisId);
    setCollectionsDialogOpen(true);
  };
  const modalOpen = useMemo(
    () => deleteDialogOpen || renameDialogOpen || exportDialogOpen || collectionsDialogOpen,
    [deleteDialogOpen, renameDialogOpen, exportDialogOpen, collectionsDialogOpen]
  );
  const { show } = useContextMenu({
    id: "file-context-menu",
  });
  const showContextMenu = (e: React.MouseEvent, analysis: Analysis) => {
    show({ event: e, props: { analysis }, position: { x: e.clientX, y: e.clientY } });
  };
  const listRef = React.useRef<HTMLDivElement>(null);

  const fileManager = useFileManager({
    onDeleted: () => {
      refetch();
      setDeleteDialogOpen(false);
      setSelected(null);
    },
    onRenamed: () => {
      refetch();
      setRenameDialogOpen(false);
    },
    onAssignedCollections: () => {
      refetch();
      setCollectionsDialogOpen(false);
    },
  });
  useEffect(() => {
    const handleOutsideClick = (event: any) => {
      if (modalOpen) return;
      if (listRef.current && !listRef.current.contains(event.target)) {
        setSelected(null);
      }
    };
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        setSelected(null);
      }
      if (e.code === "Enter") {
        // if (selected) {
        //   router.push(`/study/analyze?id=${selected}`);
        // }
      }
      if (e.code === "Delete") {
        if (selected) {
          showDeleteDialog(selected);
        }
      }
    };
    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", keyDownHandler);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("keydown", keyDownHandler);
    };
  }, [selected, modalOpen]);

  const showDialog = ({ analysisId, dialog }: { analysisId: string; dialog: DialogKey }) => {
    switch (dialog) {
      case "delete":
        showDeleteDialog(analysisId);
        break;
      case "rename":
        showRenameDialog(analysisId);
        break;
      case "export":
        showExportDialog(analysisId);
        break;
      case "collections":
        showCollectionsDialog(analysisId);
        break;
    }
  };

  return (
    <>
      <Portal>
        <FileMenu showDialog={showDialog} fileManager={fileManager} />
      </Portal>
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        closeModal={() => {
          setDeleteDialogOpen(false);
        }}
        onConfirm={() => {
          if (selected) {
            fileManager.deleteAnalysis(selected);
          }
        }}
        onCancel={() => {
          setDeleteDialogOpen(false);
        }}
        title="Delete Analysis?"
        message="Are you sure you want to delete this analysis? This action cannot be undone."
        cancelText="Cancel"
        confirmText="Delete"
        isLoading={fileManager.isDeletingAnalysis}
        loadingText="Deleting Analysis..."
      />
      <RenameDialog
        isOpen={renameDialogOpen}
        closeModal={() => {
          setRenameDialogOpen(false);
        }}
        onConfirm={({ name }) => {
          if (selected) {
            fileManager.renameAnalysis({
              analysisId: selected,
              newName: name,
            });
          } else {
            setRenameDialogOpen(false);
          }
        }}
        currentName={selected ? analyses.find((a) => a.id === selected)?.title || "" : ""}
        isLoading={fileManager.isRenamingAnalysis}
      />
      <CollectionsDialog
        isOpen={collectionsDialogOpen}
        closeModal={() => {
          setCollectionsDialogOpen(false);
        }}
        selectedAnalysis={selected ? analyses.find((a) => a.id === selected) || null : null}
        onConfirm={(id, collections) => {
          if (id && collections)
            fileManager.assignCollections({
              analysisId: id,
              collectionIds: collections,
            });
        }}
      />

      <div ref={listRef} className="w-full flex flex-col">
        {analyses.map((analysis) => {
          return (
            <RenderAnalysis
              hideLastUpdate={hideLastUpdate}
              key={analysis.id}
              analysis={analysis}
              onContextMenu={(e) => showContextMenu(e, analysis)}
              selected={selected === analysis.id}
              setSelected={setSelected}
            />
          );
        })}
      </div>
    </>
  );
}

interface AnalysisProps {
  analysis: Analysis;
  onContextMenu?: (e: React.MouseEvent) => void;
  selected?: boolean;
  setSelected: (analysisId: string) => void;
  hideLastUpdate?: boolean;
}
function RenderAnalysis({ analysis, onContextMenu, setSelected, selected, hideLastUpdate }: AnalysisProps) {
  const router = useRouter();
  const onDoubleClick = () => {
    router.push(`/study/analyze?id=${analysis.id}`);
  };
  const dateString = useMemo(() => {
    if (analysis.lastUpdate) {
      const date = new Date(analysis.lastUpdate);
      return `${date.toLocaleDateString()}`;
    }
    return "";
  }, [analysis.lastUpdate]);

  return (
    <tr
      onContextMenu={(e) => {
        e.preventDefault();
        setSelected(analysis.id);
        if (onContextMenu) onContextMenu(e);
      }}
      onClick={() => {
        setSelected(analysis.id);
      }}
      onDoubleClick={onDoubleClick}
      className={classNames(
        "flex flex-row w-full items-center justify-between py-1 pb-1.5 px-2 hover:bg-elevation-3 rounded-sm",
        { "bg-elevation-3": selected }
      )}
    >
      <td className="flex flex-row items-center">
        <AiFillFile className="mr-2 inline text-light-300" />
        <span className="block truncate text-light-100">{analysis.title}</span>
      </td>
      <td className="flex flex-row items-center">
        <span
          className={classNames("text-sm text-light-300 mr-4", {
            hidden: hideLastUpdate,
          })}
        >
          {dateString}
        </span>
        <button onClick={onContextMenu}>
          <IoMdMore className="text-light-300 hover:text-gold-200 text-lg" />
        </button>
      </td>
    </tr>
  );
}

export default function FileBrowser() {
  const [queryStr, setQueryStr] = useState("");
  const debouncedQueryStr = useDebounce(queryStr, 500);
  const { collections, refetch: refetchCollections, isLoading: collectionsLoading } = useCollections();
  const [sort, setSort] = useState<{ key: "lastUpdate" | "title"; direction: "ASC" | "DESC" }>({
    key: "lastUpdate",
    direction: "DESC",
  });
  const {
    analyses,
    isLoading: analysesLoading,
    loadMore,
    hasMore,
    isLoadingMore,
    refetch: refetchAnalyses,
  } = useAnalysisSearch({
    searchParams: {
      query: debouncedQueryStr.length > 0 ? debouncedQueryStr : undefined,
      sortDirection: sort.direction,
      sortBy: sort.key,
    },
  });
  const refetchAll = () => {
    refetchCollections();
    refetchAnalyses();
  };
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView({
    threshold: 0,
    root: containerRef.current,
  });

  useEffect(() => {
    if (inView && hasMore) {
      loadMore();
    }
  }, [inView, loadMore, hasMore]);

  return (
    <div className="w-full h-full flex flex-col">
      <Tab.Group as={React.Fragment}>
        <Tab.List className="flex bg-elevation-1 shadow-lg">
          <StyledTab>Collections</StyledTab>
          <StyledTab>All Analyses</StyledTab>
        </Tab.List>
        <Tab.Panel className="w-full grow relative flex flex-col">
          <ScrollContainer ref={containerRef}>
            <>{!collections.length && collectionsLoading ? <Loading /> : <></>}</>
            <>
              {collections.map((collection) => {
                return <RenderCollection key={collection.id} collection={collection} refetch={refetchAll} />;
              })}
            </>
          </ScrollContainer>
        </Tab.Panel>
        <Tab.Panel as="table" className="w-full grow flex flex-col">
          <div className="w-full p-2">
            <div className="w-full relative">
              <span className="absolute left-0 top-0 bottom-0 pl-2 flex items-center">
                <MdSearch className="text-xl text-light-400" />
              </span>
              <span className="absolute right-0 top-0 bottom-0 pr-3 flex items-center">
                <button
                  onClick={() => {
                    setQueryStr("");
                  }}
                  className={cn("text-light-300 text-sm hover:text-light-100", {
                    hidden: queryStr.length === 0,
                  })}
                >
                  Clear
                </button>
              </span>
              <input
                value={queryStr}
                placeholder="Search analyses"
                onChange={(e) => setQueryStr(e.target.value)}
                className="display-none bg-elevation-3 rounded-md w-full shadow pl-8 py-1.5 px-4  focus:outline-none focus-visible:ring-transparent text-light-300"
              ></input>
            </div>
          </div>
          <thead>
            <tr className="flex flex-row items-center justify-between py-1 px-4 border-b border-light-400 text-sm pr-2 text-light-300">
              <td>
                <button
                  onClick={() => {
                    setSort({
                      key: "title",
                      direction: sort.key === "title" && sort.direction === "ASC" ? "DESC" : "ASC",
                    });
                  }}
                  className={classNames("p-1 px-2 rounded-md", {
                    "bg-elevation-3 text-light-200": sort.key === "title",
                  })}
                >
                  Name
                  <span
                    className={classNames({
                      "opacity-0": sort.key !== "title",
                    })}
                  >
                    {sort.direction === "ASC" ? (
                      <HiSortAscending className="inline ml-1" />
                    ) : (
                      <HiSortDescending className="inline ml-1" />
                    )}
                  </span>
                </button>
              </td>
              <td>
                <button
                  onClick={() => {
                    setSort({
                      key: "lastUpdate",
                      direction: sort.key === "lastUpdate" && sort.direction === "DESC" ? "ASC" : "DESC",
                    });
                  }}
                  className={classNames("p-1 px-2 rounded-md", {
                    "bg-elevation-3 text-light-200": sort.key === "lastUpdate",
                  })}
                >
                  Last Updated
                  <span
                    className={classNames({
                      "opacity-0": sort.key !== "lastUpdate",
                    })}
                  >
                    {sort.direction === "ASC" ? (
                      <HiSortAscending className="inline ml-1" />
                    ) : (
                      <HiSortDescending className="inline ml-1" />
                    )}
                  </span>
                </button>
              </td>
            </tr>
          </thead>
          <div className="w-full grow relative">
            <ScrollContainer>
              <>{!analyses.length && analysesLoading ? <Loading /> : <></>}</>
              <>
                {analyses && <AnalysisList analyses={analyses} refetch={refetchAll} />}
                <tr ref={ref} className="w-full min-h-1">
                  {isLoadingMore && <Loading className="py-1" />}
                </tr>
              </>
            </ScrollContainer>
          </div>
        </Tab.Panel>
      </Tab.Group>
    </div>
  );
}

function StyledTab({ children }: { children: string | JSX.Element | (string | JSX.Element)[] }) {
  return (
    <Tab
      className={({ selected }) =>
        classNames(
          "flex-1 border-b border-b-4 py-2 text-md max-w-[10em] px-4",
          "focus:outline-none ",
          selected
            ? "bg-elevation-1 border-gold-300 text-light-100"
            : "bg-elevation-1 border-elevation-1 text-light-300 hover:bg-elevation-1 hover:border-gold-300 hover:text-light-100"
        )
      }
    >
      {children}
    </Tab>
  );
}

interface StyledDisclosureProps {
  children: JSX.Element | string | Array<JSX.Element | string>;
  label: string;
  size?: number;
}
function StyledDiclosure({ children, label, size = 0 }: StyledDisclosureProps) {
  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={classNames(
              "flex justify-between w-full px-4 py-2 font-medium text-left text-light-200 hover:text-light-100 hover:bg-elevation-3",
              "focus:outline-none focus-visible:ring focus-visible:ring-white focus-visible:ring-opacity-75 group",
              {
                "text-light-100": open,
                "bg-elevation-3": open,
              }
            )}
          >
            <div
              className={classNames(" text-light-200 flex flex-row items-center group-hover:text-light-100", {
                "text-light-100": open,
              })}
            >
              <BsFillCollectionFill className="mr-2 inline text-gold-200" />
              {label}
              <span className="text-light-400 ml-1 text-sm">{`(${size})`}</span>
            </div>
            <MdExpandMore
              className={`text-gold-200 transition-transform duration-400 mt-[1px] text-xl ${
                open ? "" : "rotate-[-90deg]"
              }`}
            />
          </Disclosure.Button>

          <Disclosure.Panel className="px-4 pl-8 pt-2 pb-2 border-light-400/[0.2] border-b divide-y divide-light-400/[0.2]  w-full ">
            {children}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
