"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const axios_1 = __importDefault(require("axios"));
const fetcher = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!id)
        return null;
    const res = yield axios_1.default.get(`/api/analysis/${id}`);
    if (res.data) {
        return res.data;
    }
    else {
        return null;
    }
});
//Hook for managing loading/saving analysis from DB
function useSavedAnalysis(initialId) {
    const [id, setId] = (0, react_1.useState)(initialId || null);
    const [autoSync, setAutoSync] = (0, react_1.useState)(false);
    const queryClient = (0, react_query_1.useQueryClient)();
    const { data, error, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ["analysis", id],
        queryFn: () => fetcher(id),
        keepPreviousData: true,
        onError: () => {
            setId(null);
        },
    });
    const load = (id) => {
        setId(id);
    };
    const { mutate: save } = (0, react_query_1.useMutation)({
        mutationFn: ({ id, data }) => __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.put(`/api/analysis/${id}`, data);
            if (response && response.data)
                return response.data;
            else
                throw new Error();
        }),
        onSuccess: (data) => {
            queryClient.invalidateQueries(["analysis", id]);
            setId(data.id);
        },
    });
    const { mutate: saveAs } = (0, react_query_1.useMutation)({
        mutationFn: (data) => __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.post("/api/analysis/", data);
            console.log(data);
            console.log(response);
            if (response && response.data)
                return response.data;
            else
                throw new Error("Save failed");
        }),
        onSuccess: (data) => {
            queryClient.invalidateQueries(["analysis", id]);
            setId(data.id);
        },
    });
    const { mutate: fork } = (0, react_query_1.useMutation)({
        mutationFn: (data) => __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.post(`/api/analysis/${id}/fork`, data);
            if (response && response.data)
                return response.data.analysis;
            else
                throw new Error("Fork failed");
        }),
        onSuccess: (data) => {
            setId(data.id);
        },
    });
    return {
        data,
        error,
        isLoading,
        save,
        saveAs,
        fork,
        load,
        id,
        autoSync,
        setAutoSync,
    };
}
exports.default = useSavedAnalysis;
