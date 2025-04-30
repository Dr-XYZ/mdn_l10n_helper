import Entry from '@models/entry';

interface DiffReviewProps {
    l10nedEntry: Entry | null | undefined;
    sourceEntry: Entry | null | undefined;
    locale: string;
    splitMethod: 'double' | 'single';
    path: string | null;
    enableMarkdownProcessing: boolean;
}

export default function CompareContent({ l10nedEntry, sourceEntry, locale, splitMethod, path, enableMarkdownProcessing }: DiffReviewProps) {
    if (!l10nedEntry || !sourceEntry) {
        return <div>Entries are not available for comparison.</div>;
    }

    let splitter: string = splitMethod === 'single' ? '\n' : '\n\n';

    const processMarkdownList = (content: string) => {
        if (!enableMarkdownProcessing) {
            return content.split(splitter);
        }
        return content
            .split(splitter)
            .flatMap((block) => {
                if (splitMethod === 'double') {
                    // Handle blockquotes by removing '>' before splitting
                    const lines = block.split('\n');
                    const result: string[] = [];
                    let currentBlock = '';

                    lines.forEach((line) => {
                        const isBlockquote = line.trim().startsWith('>');
                        const processedLine = isBlockquote ? line.trim().slice(1).trim() : line;

                        if (processedLine === '') {
                            // On empty line, push the current block and reset
                            if (currentBlock) {
                                result.push(currentBlock);
                                currentBlock = '';
                            }
                        } else {
                            // Append processed lines to the current block
                            currentBlock += (currentBlock ? '\n' : '') + (isBlockquote ? `> ${processedLine}` : processedLine);
                        }
                    });

                    // Push the last block if it exists
                    if (currentBlock) {
                        result.push(currentBlock);
                    }

                    return result;
                }
                return block.split(/\n(?=\s*- )|(?=\n>)/); // Single split mode
            });
    };

    const l10nedLines = processMarkdownList(l10nedEntry.content);
    const sourceLines = processMarkdownList(sourceEntry.content);
    const maxLength = Math.max(l10nedLines.length, sourceLines.length);

    return (
        <>
            <section className="flex flex-row break-all">
                <div className="w-1/2">
                    <h2 className="text-2xl font-bold">
                        Localized <span>{locale}</span>
                    </h2>
                    <L10nedEntryProperties entry={l10nedEntry} />
                </div>
                <div className="w-1/2">
                    <h2 className="text-2xl font-bold">Source</h2>
                    <SourceEntryProperties entry={sourceEntry} path={path} />
                </div>
            </section>
            <section>
                {Array.from({ length: maxLength }).flatMap((_, i) => {
                    const isMarkdownListItem = (line: string) => line.trim().startsWith('- ');
                    const isMarkdownBlockquote = (line: string) => line.trim().startsWith('>');

                    const currentIsMarkdown =
                        isMarkdownListItem(l10nedLines[i] || '') ||
                        isMarkdownListItem(sourceLines[i] || '') ||
                        isMarkdownBlockquote(l10nedLines[i] || '') ||
                        isMarkdownBlockquote(sourceLines[i] || '');

                    const nextIsMarkdown =
                        i + 1 < maxLength &&
                        (isMarkdownListItem(l10nedLines[i + 1] || '') ||
                            isMarkdownListItem(sourceLines[i + 1] || '') ||
                            isMarkdownBlockquote(l10nedLines[i + 1] || '') ||
                            isMarkdownBlockquote(sourceLines[i + 1] || ''));

                    // 判斷當前與下一行都是 blockquote
                    const isCurrentBqL10n = isMarkdownBlockquote(l10nedLines[i] || '');
                    const isCurrentBqSrc = isMarkdownBlockquote(sourceLines[i] || '');
                    const isNextBqL10n = i + 1 < maxLength && isMarkdownBlockquote(l10nedLines[i + 1] || '');
                    const isNextBqSrc = i + 1 < maxLength && isMarkdownBlockquote(sourceLines[i + 1] || '');

                    const row = [
                        <div
                            key={i}
                            className={`flex rounded px-4 py-1 font-mono break-all whitespace-pre-wrap hover:bg-gray-200 dark:hover:bg-gray-700`}
                        >
                            <div className="mr-4 w-1/2">{l10nedLines[i] || <>&nbsp;</>}</div>
                            <div className="w-1/2">{sourceLines[i] || <>&nbsp;</>}</div>
                        </div>
                    ];

                    // 若 l10n 是 bq 且下一行也是 bq，則在 l10n 欄插入 '>'
                    if (splitMethod === 'double' && i < maxLength - 1 && isCurrentBqL10n && isNextBqL10n) {
                        row.push(
                            <div
                                key={`bq-sep-l10n-${i}`}
                                className="flex rounded px-4 py-1 font-mono break-all whitespace-pre-wrap hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                                <div className="mr-4 w-1/2 flex justify-start text-gray-400" style={{ fontFamily: 'inherit' }}>{'>'}</div>
                                <div className="w-1/2" />
                            </div>
                        );
                    }
                    // 若 source 是 bq 且下一行也是 bq，則在 source 欄插入 '>'
                    if (splitMethod === 'double' && i < maxLength - 1 && isCurrentBqSrc && isNextBqSrc) {
                        row.push(
                            <div
                                key={`bq-sep-src-${i}`}
                                className="flex rounded px-4 py-1 font-mono break-all whitespace-pre-wrap hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                                <div className="mr-4 w-1/2" />
                                <div className="w-1/2 flex justify-start text-gray-400" style={{ fontFamily: 'inherit' }}>{'>'}</div>
                            </div>
                        );
                    }
                    if (splitMethod === 'double' && i < maxLength - 1 && (!currentIsMarkdown || !nextIsMarkdown)) {
                        row.push(
                            <div key={`spacer-${i}`} className="h-4" />
                        );
                    }
                    return row;
                })}
            </section>
        </>
    );
}

function L10nedEntryProperties({ entry }: { entry: Entry | null | undefined }) {
    if (entry === undefined) {
        return null;
    } else if (entry === null) {
        return <div>Entry not localized yet</div>;
    } else {
        return (
            <div>
                <h3 className="text-xl font-bold">Metadata</h3>
                <ul>
                    <li>
                        <b>Title</b>: <code>{entry?.title}</code>
                    </li>
                    <li>
                        <b>Slug</b>: <code>{entry?.slug}</code>
                    </li>
                    <li>
                        <b>Source Commit</b>: <code>{entry?.sourceCommit}</code>
                    </li>
                    <li />
                </ul>
            </div>
        );
    }
}

function SourceEntryProperties({ entry, path }: { entry: Entry | null | undefined; path: string | null }) {
    if (entry === undefined) {
        return null;
    } else if (entry === null) {
        return <div>Entry not localized yet</div>;
    } else {
        return (
            <div>
                <h3 className="text-xl font-bold">Metadata</h3>
                <ul>
                    <li>
                        <b>Title</b>: <code>{entry?.title}</code>
                    </li>
                    <li>
                        <b>Slug</b>: <code>{entry?.slug}</code>
                    </li>
                    <li>
                        <b>Current Commit</b>: <code>{entry?.sourceCommit}</code>
                    </li>
                    <li>
                        <b>Link to File</b>:
                        <a href={`https://github.com/mdn/content/blob/main/files/en-us/${path}/index.md`}>
                            Click HERE!
                        </a>
                    </li>
                </ul>
            </div>
        );
    }
}
