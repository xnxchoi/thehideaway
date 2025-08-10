"use client";

import {Highlight, themes} from "prism-react-renderer";
import React, {useEffect, useState} from "react";

import {CopyButton} from "./CopyButton";
import {useTheme} from "@/providers/Theme";

type Props = {
	code: string;
	language?: string;
};

export const Code: React.FC<Props> = ({code, language = ""}) => {
	const theme = useTheme((r) => r.theme);
	const [codeTheme, setCodeTheme] = useState(
		theme === "dark" ? themes.nightOwl : themes.nightOwlLight,
	);
	useEffect(() => {
		setCodeTheme(theme === "dark" ? themes.nightOwl : themes.nightOwlLight);
	}, [theme]);
	if (!code) return null;
	return (
		<Highlight code={code} language={language} theme={codeTheme}>
			{({getLineProps, getTokenProps, tokens}) => (
				<pre
					className="overflow-x-auto rounded-[4px] border border-muted-faded-background/55 bg-background p-4 text-xs">
          {tokens.map((line, i) => (
	          <div key={i + "key-token"}
	               {...getLineProps({className: "table-row", line})}
	          >
              <span className="table-cell select-none text-right text-[oklch(var(--faded-fg)/.25)]">
                {i + 1}
              </span>
		          <span className="table-cell pl-4">
                {line.map((token, key) => (
	                <span key={key + "key-token-line"}
	                      {...getTokenProps({token})} />
                ))}
              </span>
	          </div>
          ))}
					<CopyButton code={code} />
        </pre>
			)}
		</Highlight>
	);
};
