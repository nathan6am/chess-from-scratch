"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const Chess = __importStar(require("@/lib/chess"));
const misc_1 = require("@/util/misc");
const useDebounce_1 = __importDefault(require("./useDebounce"));
const defaultOptions = {
    startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    database: "lichess",
    moves: 10,
    topGames: 15,
};
var Endpoints;
(function (Endpoints) {
    Endpoints["lichess"] = "https://explorer.lichess.ovh/lichess?topGames=15";
    Endpoints["masters"] = "https://explorer.lichess.ovh/masters";
})(Endpoints || (Endpoints = {}));
const lodash_1 = __importDefault(require("lodash"));
const reduceMoves = (history) => history
    .flat()
    .filter(misc_1.notEmpty)
    .map((halfMove) => Chess.MoveToUci(halfMove.move))
    .join(",");
const fetcher = async (game, database) => {
    const fen = game.config.startPosition;
    const play = reduceMoves(game.moveHistory);
    const endpoint = Endpoints[database];
    const response = await axios_1.default.get(endpoint, {
        params: {
            fen,
            play,
        },
    });
    if (!response.data)
        throw new Error("No response data");
    return response.data;
};
function useOpeningExplorer(currentGame) {
    const [database, setDatabase] = (0, react_1.useState)("masters");
    const [mastersFilters, setMastersFilters] = (0, react_1.useState)({});
    const [lichessFilters, setLichessFilters] = (0, react_1.useState)({});
    const [gameId, fetchOTBGame] = (0, react_1.useState)(null);
    //Debounce game state for api calls
    const debouncedGame = (0, useDebounce_1.default)(currentGame, 700);
    //Ref to set loading state when currentGame changes before debounced game upates
    const debounceSyncRef = (0, react_1.useRef)(false);
    const prevGameRef = (0, react_1.useRef)(currentGame);
    (0, react_1.useEffect)(() => {
        if (lodash_1.default.isEqual(currentGame.fen, debouncedGame.fen))
            debounceSyncRef.current = true;
        else {
            debounceSyncRef.current = false;
        }
    }, [currentGame, debouncedGame, debounceSyncRef]);
    const { data, error, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ["explorer", debouncedGame, database],
        queryFn: () => fetcher(debouncedGame, database),
        keepPreviousData: true,
    });
    const { data: otbGame, error: otbGameError, isLoading: otbGameLoading, } = (0, react_query_1.useQuery)({
        queryKey: ["otbgame", gameId],
        queryFn: async () => {
            if (!gameId)
                return null;
            if (database === "lichess") {
                const response = await axios_1.default.get(`https://lichess.org/game/export/${gameId}`, {});
                console.log(response);
                if (response && response.data) {
                    const pgn = response.data;
                    return {
                        pgn,
                        id: gameId,
                        type: "lichess",
                    };
                }
            }
            else if (database === "masters") {
                const response = await axios_1.default.get(`https://explorer.lichess.ovh/masters/pgn/${gameId}`);
                if (response && response.data) {
                    const pgn = response.data;
                    return {
                        pgn,
                        id: gameId,
                        type: "masters",
                    };
                }
            }
            throw new Error();
        },
    });
    const fetchGameAsync = async (gameid, gameType) => {
        if (gameType === "lichess") {
            const response = await axios_1.default.get(`https://lichess.org/game/export/${gameid}`, {});
            if (response && response.data)
                return response.data;
        }
        else if (gameType === "masters") {
            const response = await axios_1.default.get(`https://explorer.lichess.ovh/masters/pgn/${gameid}`);
            if (response && response.data)
                return response.data;
        }
        return undefined;
    };
    return {
        database,
        setDatabase,
        otbGameLoading,
        fetchOTBGame,
        otbGame,
        data,
        error,
        isLoading: debounceSyncRef.current ? isLoading : true,
        sourceGame: debouncedGame,
        fetchGameAsync,
    };
}
exports.default = useOpeningExplorer;
