import { useState, useMemo, Fragment, useRef } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import countries from "@/lib/data/countries";
import { BsChevronExpand } from "react-icons/bs";

interface ListItem {
  id: string;
  name: string;
}
const options: ListItem[] = Object.entries(countries).map((entry) => {
  const [key, value] = entry;
  return {
    id: key,
    name: value,
  };
});

interface Props {
  onChange: (value: ListItem | null) => void;
}
function CountrySelect({ onChange }: Props) {
  const [selectedCountry, setSelectedCountry] = useState<null | { id: string; name: string }>(null);
  const [query, setQuery] = useState("");

  const filteredCountries = useMemo(() => {
    if (!query.length) {
      return options;
    }
    if (query.length < 3) {
      return options.filter((country) => {
        return country.name.toLowerCase().startsWith(query.toLowerCase());
      });
    }
    return options.filter((country) => {
      return country.name.toLowerCase().includes(query.toLowerCase());
    });
  }, [query]);

  return (
    <Combobox
      value={selectedCountry}
      onChange={(value) => {
        onChange(value);
        setSelectedCountry(value);
      }}
      nullable
    >
      <div className="relative mt-1">
        <div className="relative w-full cursor-default overflow-hidden rounded-md text-left shadow-md ">
          <Combobox.Input
            placeholder="Select a country"
            onFocus={() => {
              if (selectedCountry === null) {
              }
            }}
            className="w-full appearance-none border-white/[0.3] border-2 focus:border-white/[0.8] border-box rounded-md w-full py-2 px-3 text-md bg-black/[0.3] text-gold-200 placeholder:text-gray-300 leading-tight focus:outline-none"
            displayValue={(option: { id: string; name: string } | null) => option?.name || ""}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <BsChevronExpand color="rgba(255,255,255, 0.5)" size={20} />
          </Combobox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery("")}
        >
          <Combobox.Options>
            {filteredCountries.length === 0 && query !== "" ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">Nothing found.</div>
            ) : (
              <VirtualizedList items={filteredCountries ?? []} />
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}

export default CountrySelect;

function VirtualizedList({ items }: { items: ListItem[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items?.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#1f1f1f] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow: any) => (
          <Combobox.Option
            key={virtualRow.index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
            className={({ active }) =>
              `relative cursor-default select-none py-2 pl-4 pr-4 ${
                active ? "bg-elevation-4 text-white" : "text-white/[0.5]"
              }`
            }
            value={items?.[virtualRow.index]}
          >
            {({ selected, active }) => (
              <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                {items?.[virtualRow.index].name}
              </span>
            )}
          </Combobox.Option>
        ))}
      </div>
    </div>
  );
}
