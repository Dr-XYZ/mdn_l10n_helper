import { useContext, useState } from 'react';
import Entry from '@models/entry';
import DiffReview from './diff-review';
import { BannerContext } from '@/App';
import Spinner from '@components/spinner/spinner';
import { usePreferences } from '@utils/preferences-context';
import { useSearchParams } from 'react-router';

export default function ComparePage() {
    const [searchParams] = useSearchParams();
    const path = searchParams.get('path'),
        locale = searchParams.get('locale'),
        owner = searchParams.get('owner'),
        branch = searchParams.get('branch');

    const [filePath, setFilePath] = useState<string | undefined>(path ?? undefined),
        [fileLocale, setFileLocale] = useState<string | undefined>(locale ?? undefined),
        [l10nOwner, setL10nOwner] = useState<string | undefined>(owner ?? undefined),
        [l10nBranch, setL10nBranch] = useState<string | undefined>(branch ?? undefined),
        [l10nedEntry, setL10nedEntry] = useState<Entry | null | undefined>(),
        [sourceEntry, setSourceEntry] = useState<Entry | null | undefined>(),
        [loading, setLoading] = useState(false),
        [splitMethod, setSplitMethod] = useState<'double' | 'single'>(
            localStorage.getItem('splitMode') === 'true' ? 'double' : 'single'
        ),
        [enableMarkdownProcessing, setEnableMarkdownProcessing] = useState(
            localStorage.getItem('mdListProcessOption') === 'true'
        ),
        [settingsVisible, setSettingsVisible] = useState(false);

    const [tempSplitMethod, setTempSplitMethod] = useState(splitMethod);
    const [tempEnableMarkdownProcessing, setTempEnableMarkdownProcessing] = useState(enableMarkdownProcessing);

    const openSettings = () => {
        setTempSplitMethod(splitMethod);
        setTempEnableMarkdownProcessing(enableMarkdownProcessing);
        setSettingsVisible(true);
    };

    const cancelSettings = () => {
        setSplitMethod(tempSplitMethod);
        setEnableMarkdownProcessing(tempEnableMarkdownProcessing);
        setSettingsVisible(false);
    };

    const { setMessage } = useContext(BannerContext);
    const { preferences } = usePreferences();

    const fetchEntries = async () => {
        setLoading(true);
        if (!filePath || !fileLocale || !l10nBranch || !l10nOwner) {
            setMessage({ message: 'Path and locale are required', type: 'error' });
            return;
        }
        try {
            setL10nedEntry(
                await Entry.fromGitHub(
                    l10nOwner,
                    'translated-content',
                    l10nBranch,
                    filePath,
                    fileLocale,
                    preferences.accessToken
                )
            );
            setSourceEntry(
                await Entry.fromGitHub('mdn', 'content', 'main', filePath, 'en-us', preferences.accessToken)
            );
            setMessage({ message: 'Entries fetched successfully', type: 'success' });
        } catch (e: any) {
            setMessage({ message: e.message, type: 'error' });
        }
        setLoading(false);
    };

    const saveEntries = () => {
            if (!l10nedEntry || !sourceEntry) {
                setMessage({ message: 'No entries to save', type: 'info' });
                return;
            }
            try {
                localStorage.setItem(
                    'e_' + path,
                    JSON.stringify({
                        l10ned: l10nedEntry,
                        source: sourceEntry,
                    })
                );
                setMessage({ message: 'Entries saved to localStorage', type: 'success' });
            } catch (e: any) {
                setMessage({ message: e.message, type: 'error' });
                return;
            }
        },
        readEntries = () => {
            const data = localStorage.getItem('e_' + path);
            if (!data) {
                setMessage({ message: 'No entries with the given path found in localStorage', type: 'error' });
                return;
            }
            try {
                const parsed = JSON.parse(data);
                setL10nedEntry(parsed.l10ned);
                setSourceEntry(parsed.source);
                setMessage({ message: 'Entries read from localStorage', type: 'success' });
            } catch (e: any) {
                setMessage({ message: e.message, type: 'error' });
            }
        };

    return (
        <main className="container mx-auto mt-4">
            <h1 className="mb-8 text-4xl font-bold">Compare</h1>
            <div className="my-4 flex space-x-1">
                <div>
                    <div className="pb-1 font-medium text-gray-700 dark:text-gray-200">
                        Owner{' '}
                        <small>
                            e.g. <code>mdn</code>
                        </small>
                    </div>
                    <input
                        className="w-full rounded border-2 border-amber-400 bg-transparent px-4 py-1.5"
                        type="text"
                        value={l10nOwner}
                        onChange={(e) => setL10nOwner(e.target.value)}
                    />
                </div>
                <div>
                    <div className="pb-1 font-medium text-gray-700 dark:text-gray-200">
                        Branch{' '}
                        <small>
                            e.g. <code>main</code>
                        </small>
                    </div>
                    <input
                        className="w-full rounded border-2 border-amber-400 bg-transparent px-4 py-1.5"
                        type="text"
                        value={l10nBranch}
                        onChange={(e) => setL10nBranch(e.target.value)}
                    />
                </div>
                <div className="flex-1">
                    <div className="pb-1 font-medium text-gray-700 dark:text-gray-200">
                        Path{' '}
                        <small>
                            e.g. <code>mozilla/add-ons</code>
                        </small>
                    </div>
                    <input
                        className="w-full rounded border-2 border-amber-400 bg-transparent px-4 py-1.5"
                        type="text"
                        value={filePath}
                        onChange={(e) => setFilePath(e.target.value)}
                    />
                </div>
                <div>
                    <div className="pb-1 font-medium text-gray-700 dark:text-gray-200">
                        Locale{' '}
                        <small>
                            e.g. <code>en-us</code>
                        </small>
                    </div>
                    <input
                        className="rounded border-2 border-amber-400 bg-transparent px-4 py-1.5"
                        type="text"
                        value={fileLocale}
                        onChange={(e) => setFileLocale(e.target.value)}
                    />
                </div>
            </div>
            <div className="my-4 flex space-x-1">
                <button
                    className="rounded border-2 border-amber-400 bg-transparent px-4 py-1.5 hover:bg-amber-100 dark:hover:bg-amber-900"
                    onClick={fetchEntries}
                >
                    Fetch
                </button>
                <button
                    className="rounded border-2 border-amber-400 bg-transparent px-4 py-1.5 hover:bg-amber-100 dark:hover:bg-amber-900"
                    onClick={saveEntries}
                >
                    Save Changes <br />
                    <small>to localStorage</small>
                </button>
                <button
                    className="rounded border-2 border-amber-400 bg-transparent px-4 py-1.5 hover:bg-amber-100 dark:hover:bg-amber-900"
                    onClick={readEntries}
                >
                    Read Changes <br />
                    <small>from localStorage</small>
                </button>
                <button
                    className="rounded border-2 border-amber-400 bg-transparent px-4 py-1.5 hover:bg-amber-100 dark:hover:bg-amber-900"
                    onClick={openSettings}
                >
                    Open Settings
                </button>
            </div>

            {settingsVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-96 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
                        <h2 className="mb-4 text-2xl font-bold">Settings</h2>
                        <div className="mb-4">
                            <label className="block font-medium text-gray-700 dark:text-gray-200">
                                Split Method
                            </label>
                            <select
                                id="split-method-select"
                                className="w-full rounded border-2 border-amber-400 bg-transparent px-4 py-1.5"
                                value={tempSplitMethod}
                                onChange={(e) => setTempSplitMethod(e.target.value as 'double' | 'single')}
                            >
                                <option value="double">Double (\n\n)</option>
                                <option value="single">Single (\n)</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={tempEnableMarkdownProcessing}
                                    onChange={(e) => setTempEnableMarkdownProcessing(e.target.checked)}
                                    className="mr-2"
                                />
                                <span>Enable Markdown List Processing</span>
                            </label>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="rounded border-2 border-gray-400 bg-transparent px-4 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={cancelSettings}
                            >
                                Cancel
                            </button>
                            <button
                                className="rounded border-2 border-amber-400 bg-transparent px-4 py-1.5 hover:bg-amber-100 dark:hover:bg-amber-900"
                                onClick={() => {
                                    setSplitMethod(tempSplitMethod);
                                    setEnableMarkdownProcessing(tempEnableMarkdownProcessing);
                                    setSettingsVisible(false);
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {l10nedEntry && sourceEntry && locale && (
                <DiffReview
                    key={splitMethod}
                    l10nedEntry={l10nedEntry}
                    sourceEntry={sourceEntry}
                    locale={locale}
                    splitMethod={splitMethod}
                    path={path}
                    enableMarkdownProcessing={enableMarkdownProcessing}
                />
            )}

            {loading && <Spinner />}
        </main>
    );
}
