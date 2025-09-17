/**
 * 
    const updateRect = useCallback((a: RangeRect, t: Element) => {
        const b = t.getBoundingClientRect();
        const right = Math.max(a.right, b.right);
        const left = Math.min(a.left, b.left);
        const width = right - left;
        return {
            top: Math.min(a.top, b.top), left, right, width,
        };
    }, []);
  
const HighlightMenu = ({
    visible, handleUpdate, top, left, handleSaveHighlight, handleChangeHighlightColor, createCallback
}: HighlightMenuProps) => {
    const privateMemoOpen = usePrivateNote(r => r.open)
    const t = useTranslations()
    const currentHighlightColor = useHighlighter(r => r.currentColor)
    const [render, setRender] = useState(false);
    const ref = useRef<HTMLDivElement>(null!);
    const lastVisible = useRef(false);
    const focusedHighlight = useHighlighter(r => r.focusedHighlight);
    const lastCoords = useRef({x: 0, y: 0});
    const lastTime = useRef(0);


    const target = useHighlighter(r => r.target)


    const doMe = useCallback((e: Event) => {
        if (!e.target) return;
        if (!ref.current) {
            document.body.removeEventListener("click", doMe);
            return;
        }
        if (!ref.current.contains(e.target as HTMLElement)) {
            setRender(false);
            document.body.removeEventListener("click", doMe);
        }
    }, []);
    const handleShareHighlight = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        const se = rangey.getSelection();
        let a = se?.toString();
        if (!a && focusedHighlight) {
            a = focusedHighlight.els.map((e) => (e as HTMLElement).innerText).join(" ");
        }
        navigator.clipboard.writeText(a).then((r) => {
            successToast(t('Highlights.share.copy'));
        }).catch(() => (errorToast(t('Highlights.error.share.copy'))));
    }, [focusedHighlight, t],);

    useEffect(() => {
        const now = DateTime.now().toMillis();
        const delta = now - lastTime.current;
        document.body.removeEventListener("click", doMe);
        if (lastVisible.current !== visible || delta > 400) {
            const topo = typeof top === "number" ? top : 0;
            const lefto = typeof left === "number" ? left : 0;
            lastCoords.current = {x: lefto, y: topo};
            setRender(visible);
            lastTime.current = now;
            document.body.addEventListener("click", doMe);
        }

        lastVisible.current = visible;
        return () => {
            document.body.removeEventListener("click", doMe);
        }
    }, [visible, top, left, doMe,]);
    useEffect(() => {
        if (privateMemoOpen) {
            document.body.removeEventListener("click", doMe);
        } else {
            document.body.addEventListener("click", doMe);
        }
    }, [privateMemoOpen, doMe])
    return (<AnimatePresence mode="wait">
        {render && (<m.div ref={ref} key={"res"} className={cn(
            "absolute z-[250] left-auto right-auto m-0 flex overflow-hidden rounded-2xl border-none opacity-0",
            "pointer-events-auto",)} data-themed={"background-color"} style={{
            transform: `translate(${lastCoords.current.x}px,${lastCoords.current.y}px)`,
        }} initial={{
            opacity: 0,
        }} animate={{
            opacity: 1, transition: {
                delay: 0.1,
            },
        }} exit={{
            opacity: 0,
        }} transition={{
            duration: 0.3, ease: "easeOut",
        }}>
            <div className={"relative z-[210] h-full w-full p-0"}>
                <div className={"bg-faded-d-gray dark:bg-faded-l-gray absolute top-0 left-0 z-[1] h-full w-full"} />
                <m.div className={"text-off-foreground z-[23] flex h-[44px] items-center px-3.5"}>
                    <MemoButton saveCallback={handleUpdate} createCallback={createCallback} className={'border-r-[1px]'}
                                postId={target.value} documentHandler={doMe}>
                    </MemoButton>
                    <HighlightMenuButton onClick={handleSaveHighlight}>
                        {focusedHighlight ? "Delete" : "Highlight"}
                        <MenuButtonCaption>
                            <svg width="7" height="7.5" viewBox="0 0 7 7.5" fill="none"
                                 xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M3.7 7.46C3.33 7.46 3.08 7.11 3.08 6.66C3.08 6.41 3.17 6.03 3.35 5.52C3.53 5 3.62 4.5 3.62 3.98C3.18 4.25 2.85 4.53 2.6 4.81C2.1 5.37 1.61 5.92 1.09 5.92C0.77 5.92 0.51 5.67 0.51 5.37C0.51 5.04 0.78 4.71 1.37 4.55C1.66 4.47 1.99 4.38 2.36 4.31C2.72 4.24 3.12 4.08 3.54 3.84C3.11 3.6 2.7 3.44 2.32 3.36C1.57 3.2 0.97 3.07 0.71 2.77C0.58 2.62 0.51 2.46 0.51 2.29C0.51 1.99 0.75 1.76 1.1 1.76C1.63 1.76 2.25 2.46 2.69 2.96C2.91 3.21 3.22 3.46 3.62 3.7V3.57C3.62 3.17 3.59 2.84 3.51 2.6C3.35 2.12 3.1 1.37 3.1 1.02C3.1 0.559999 3.36 0.22 3.72 0.22C4.07 0.22 4.34 0.54 4.34 1.02C4.34 1.26 4.25 1.65 4.07 2.18C3.89 2.71 3.8 3.22 3.8 3.7C4.37 3.34 4.3 3.38 4.79 2.91C5.26 2.39 5.59 2.07 5.77 1.95C5.96 1.82 6.15 1.76 6.35 1.76C6.67 1.76 6.91 1.98 6.91 2.29C6.91 2.63 6.66 2.92 6.08 3.11C5.8 3.2 5.47 3.28 5.1 3.36C4.72 3.44 4.32 3.6 3.88 3.84C4.31 4.08 4.7 4.23 5.07 4.31C5.8 4.47 6.42 4.61 6.7 4.9C6.84 5.05 6.91 5.2 6.91 5.37C6.91 5.67 6.67 5.92 6.32 5.92C5.73 5.92 4.97 4.98 4.68 4.65C4.54 4.49 4.24 4.26 3.8 3.98V4.11C3.8 4.54 3.89 5.02 4.06 5.54C4.23 6.06 4.32 6.43 4.32 6.66C4.32 7.13 4.05 7.46 3.7 7.46Z"
                                    fill="currentColor" />
                            </svg>
                        </MenuButtonCaption>
                    </HighlightMenuButton>
                    <HighlightMenuButton focusedHighlight={!!focusedHighlight} onClick={handleShareHighlight}>
                        Share
                        <MenuButtonCaption>
                            <svg width="8" height="8" viewBox="0 0 11 11" fill="none"
                                 xmlns="http://www.w3.org/2000/svg">
                                <path d="M0.98223 4.62115H7.33145V10.9704H0.98223V4.62115Z" fill="currentColor" />
                                <path d="M4.63299 0.970398H10.9822V7.31962H9.15048L9.13914 2.80188H4.63299V0.970398Z"
                                      fill="currentColor" />
                            </svg>
                        </MenuButtonCaption>
                    </HighlightMenuButton>
                    {focusedHighlight && (<m.div initial={{
                        scaleX: 0.001, opacity: 0,
                    }} animate={{
                        scaleX: 1, opacity: 1,
                    }} exit={{
                        scaleX: 0.001, opacity: 0,
                    }} transition={{
                        type: "tween", duration: 0.2, ease: "easeOut",
                    }} className={"z-[13] mr-[16px] ml-[16px] flex gap-[4px]"}>
                        {Palettes.map((palette, index) => (
                            <HighlightColorPickerItem key={palette} color={palette}
                                                     onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                            }} handleSelect={handleChangeHighlightColor}   onMouseUp={(e) => e.stopPropagation()}></HighlightColorPickerItem>))}
                    </m.div>)}
                </m.div>
            </div>
        </m.div>)}
    </AnimatePresence>);
};
 */