import {useContext, useState} from "react";
import Entry from "@model/entry";
import DiffReview from "./diff-review";
import {BannerContext} from "@/App";
import Spinner from "@components/spinner/spinner";
import {usePreferences} from "@utils/preferences-context";
import {useSearchParams} from "react-router-dom";

export default function ComparePage() {
    const [searchParams] = useSearchParams();
    const path = searchParams.get("path"),
        locale = searchParams.get("locale"),
        owner = searchParams.get("owner"),
        branch = searchParams.get("branch");

    const [filePath, setFilePath] = useState<string | undefined>(path ?? undefined),
        [fileLocale, setFileLocale] = useState<string | undefined>(locale ?? undefined),
        [l10nOwner, setL10nOwner] = useState<string | undefined>(owner ?? undefined),
        [l10nBranch, setL10nBranch] = useState<string | undefined>(branch ?? undefined),
        [l10nedEntry, setL10nedEntry] = useState<Entry | null | undefined>(),
        [sourceEntry, setSourceEntry] = useState<Entry | null | undefined>(),
        [loading, setLoading] = useState(false);

    const {setMessage} = useContext(BannerContext);
    const {preferences} = usePreferences();

    const fetchEntries = async () => {
        setLoading(true);
        if (!filePath || !fileLocale || !l10nBranch || !l10nOwner) {
            setMessage({message: "Path and locale are required", type: "error"});
            return;
        }
        try {
            setL10nedEntry(await Entry.fromGitHub(l10nOwner, "translated-content", l10nBranch, filePath, fileLocale, preferences.accessToken));
            setSourceEntry(await Entry.fromGitHub("mdn", "content", "main", filePath, "en-us", preferences.accessToken));
            setMessage({message: "Entries fetched successfully", type: "success"});
        } catch (e: any) {
            setMessage({message: e.message, type: "error"});
        }
        setLoading(false);
    };

    const saveEntries = () => {
        if (!l10nedEntry || !sourceEntry) {
            setMessage({message: "No entries to save", type: "info"});
            return;
        }
        try {
            localStorage.setItem("e_" + path, JSON.stringify({
                l10ned: l10nedEntry,
                source: sourceEntry
            }));
            setMessage({message: "Entries saved to localStorage", type: "success"});
        } catch (e: any) {
            setMessage({message: e.message, type: "error"});
            return;
        }
    }, readEntries = () => {
        const data = localStorage.getItem("e_" + path);
        if (!data) {
            setMessage({message: "No entries with the given path found in localStorage", type: "error"});
            return;
        }
        try {
            const parsed = JSON.parse(data);
            setL10nedEntry(parsed.l10ned);
            setSourceEntry(parsed.source);
            setMessage({message: "Entries read from localStorage", type: "success"});
        } catch (e: any) {
            setMessage({message: e.message, type: "error"});
        }
    };

    return (
        <main className="container mx-auto mt-4">
            <h1 className="text-4xl font-bold mb-8">Compare</h1>
            <div className="flex space-x-1 my-4">
                <div>
                    <div className="font-medium text-gray-700 dark:text-gray-200 pb-1">
                        Owner <small>e.g. <code>mdn</code></small>
                    </div>
                    <input className="w-full px-4 py-1.5 rounded border-2 border-amber-400 bg-transparent" type="text"
                           value={l10nOwner}
                           onChange={e => setL10nOwner(e.target.value)}/>
                </div>
                <div>
                    <div className="font-medium text-gray-700 dark:text-gray-200 pb-1">
                        Branch <small>e.g. <code>main</code></small>
                    </div>
                    <input className="w-full px-4 py-1.5 rounded border-2 border-amber-400 bg-transparent" type="text"
                           value={l10nBranch}
                           onChange={e => setL10nBranch(e.target.value)}/>
                </div>
                <div className="flex-1">
                    <div className="font-medium text-gray-700 dark:text-gray-200 pb-1">
                        Path <small>e.g. <code>mozilla/add-ons</code></small>
                    </div>
                    <input className="w-full px-4 py-1.5 rounded border-2 border-amber-400 bg-transparent" type="text"
                           value={filePath}
                           onChange={e => setFilePath(e.target.value)}/>
                </div>
                <div>
                    <div className="font-medium text-gray-700 dark:text-gray-200 pb-1">
                        Locale <small>e.g. <code>en-us</code></small>
                    </div>
                    <input className="px-4 py-1.5 rounded border-2 border-amber-400 bg-transparent" type="text"
                           value={fileLocale}
                           onChange={e => setFileLocale(e.target.value)}/>
                </div>
            </div>
            <div className="flex space-x-1 my-4">
                <button
                    className="px-4 py-1.5 rounded border-2 border-amber-400 bg-transparent hover:bg-amber-100 dark:hover:bg-amber-900"
                    onClick={fetchEntries}>
                    Fetch
                </button>
                <button
                    className="px-4 py-1.5 rounded border-2 border-amber-400 bg-transparent hover:bg-amber-100 dark:hover:bg-amber-900"
                    onClick={saveEntries}>
                    Save Changes <br/><small>to localStorage</small>
                </button>
                <button
                    className="px-4 py-1.5 rounded border-2 border-amber-400 bg-transparent hover:bg-amber-100 dark:hover:bg-amber-900"
                    onClick={readEntries}>
                    Read Changes <br/><small>from localStorage</small>
                </button>
            </div>

            {l10nedEntry && sourceEntry && locale && (
                <DiffReview l10nedEntry={l10nedEntry} sourceEntry={sourceEntry} locale={locale}/>
            )}

            {loading && <Spinner/>}
        </main>
    );
}