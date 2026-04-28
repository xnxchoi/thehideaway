<dialog
  className="group/dialog bg-token-bg-primary @container fixed inset-0 z-50 m-0 flex h-[100dvh] max-h-none w-[100dvw] max-w-none flex-col overflow-hidden border-0 p-0 text-inherit"
  tabIndex="-1"
  aria-modal="true"
  aria-label="Ask anything"
  open=""
>
  <div className="flex h-full max-h-full flex-col">
    <div
      className="absolute start-0 top-0 z-10 flex w-full items-center justify-between bg-none px-4"
      style="min-height: var(--screen-thread-header-min-height,60px);"
    >
      <div className="absolute start-0 top-0 h-2 w-full">
        <div
          className="bg-token-bg-primary-inverse h-1.5"
          style="width: 33.3333%; opacity: 1;"
        ></div>
      </div>
      <div></div>
    </div>
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden">
      <div
        className="flex h-full w-full flex-row self-center sm:px-8 md:px-12 lg:px-16 xl:px-24"
        style="opacity: 1; transform: none;"
      >
        <div className="flex flex-1 flex-col items-center justify-center">
          <div
            className="flex w-[90%] flex-1 flex-col items-center justify-center gap-2 text-center sm:w-[320px]"
            style="opacity: 1; transform: none;"
          >
            <h1
              className="text-token-text-primary mb-2 text-3xl font-medium"
              style="opacity: 1; transform: none;"
            >
              Ask anything
            </h1>
            <p
              className="text-token-text-secondary mb-6 text-base"
              style="opacity: 1; transform: none;"
            >
              From quick questions to big ideas, ChatGPT is here to help.
            </p>
            <div className="flex w-full flex-col gap-3">
              <button className="btn btn-primary btn-large relative w-full group-focus-within/dialog:focus-visible:[outline-width:1.5px] group-focus-within/dialog:focus-visible:[outline-offset:2.5px] group-focus-within/dialog:focus-visible:[outline-color:var(--text-primary)] group-focus-within/dialog:focus-visible:[outline-style:solid]">
                <div className="flex items-center justify-center">Next</div>
              </button>
              <button className="btn btn-ghost btn-large relative group-focus-within/dialog:focus-visible:[outline-width:1.5px] group-focus-within/dialog:focus-visible:[outline-offset:2.5px] group-focus-within/dialog:focus-visible:[outline-color:var(--text-primary)] group-focus-within/dialog:focus-visible:[outline-style:solid] max-sm:hidden">
                <div className="flex items-center justify-center">
                  Skip Tour
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className="relative flex h-full flex-1 flex-col sm:min-w-[360px] sm:pt-20 sm:pb-20">
          <div className="bg-token-bg-primary shadow-token-border-default h-full w-full overflow-auto shadow-[0_0_50px] max-sm:pb-40 sm:rounded-[30px]">
            <div className="pointer-events-none min-h-full w-full">
              <div
                id="thread"
                className="group/thread flex min-h-full flex-col"
                style="--thread-show-context-pct: 1/3;"
              >
                <div
                  role="presentation"
                  className="composer-parent flex flex-1 flex-col focus-visible:outline-0"
                >
                  <div className="relative flex grow basis-auto flex-col">
                    <div className="flex flex-col text-sm">
                      <section
                        className="text-token-text-primary [&amp;:has([data-writing-block])&gt;*]:pointer-events-auto R6Vx5W_threadScrollVars w-full scroll-mt-(--header-height) scroll-mb-[calc(var(--scroll-root-safe-area-inset-bottom,0px)+var(--thread-response-height))] [--shadow-height:45px] focus:outline-none has-data-writing-block:pointer-events-none has-data-writing-block:-mt-(--shadow-height) has-data-writing-block:pt-(--shadow-height)"
                        dir="auto"
                        data-turn-id="b910ee9f-9b9e-4fae-9f85-944ba2be1f24"
                        data-testid="conversation-turn-1"
                        data-scroll-anchor="false"
                        data-turn="user"
                      >
                        <h4 className="sr-only select-none">You said:</h4>
                        <div className="@w-sm/main:[--thread-content-margin:var(--thread-content-margin-sm,calc(var(--spacing)*6))] @w-lg/main:[--thread-content-margin:var(--thread-content-margin-lg,calc(var(--spacing)*16))] mx-auto my-auto px-(--thread-content-margin) pt-3 text-base [--thread-content-margin:var(--thread-content-margin-xs,calc(var(--spacing)*4))]">
                          <div className="@w-lg/main:[--thread-content-max-width:48rem] group/turn-messages relative mx-auto mb-10 flex w-full max-w-(--thread-content-max-width) min-w-0 flex-1 flex-col [--thread-content-max-width:40rem] focus-visible:outline-hidden">
                            <div className="flex max-w-full grow flex-col gap-4">
                              <div
                                data-message-author-role="user"
                                data-message-id="b910ee9f-9b9e-4fae-9f85-944ba2be1f24"
                                dir="auto"
                                className="text-message keyboard-focused:focus-ring [.text-message+&amp;]:mt-1 relative flex min-h-8 w-full flex-col items-end gap-2 text-start break-words whitespace-normal outline-none"
                              >
                                <div className="flex w-full flex-col items-end gap-1 empty:hidden rtl:items-start">
                                  <div className="user-message-bubble-color corner-superellipse/0.98 relative max-w-(--user-chat-width,70%) min-w-0 rounded-[22px] px-4 py-2.5 leading-6">
                                    <div className="[overflow-wrap:anywhere] whitespace-pre-wrap">
                                      Suggest trendy recipes for a quick
                                      weeknight dinner
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className="sr-only">
                          <br />
                        </span>
                      </section>
                      <section
                        className="text-token-text-primary [&amp;:has([data-writing-block])&gt;*]:pointer-events-auto R6Vx5W_threadScrollVars w-full scroll-mt-[calc(var(--header-height)+min(200px,max(70px,20svh)))] scroll-mb-[calc(var(--scroll-root-safe-area-inset-bottom,0px)+var(--thread-response-height))] [--shadow-height:45px] [content-visibility:auto] focus:outline-none has-data-writing-block:pointer-events-none has-data-writing-block:-mt-(--shadow-height) has-data-writing-block:pt-(--shadow-height) supports-[content-visibility:auto]:[contain-intrinsic-size:auto_100lvh]"
                        dir="auto"
                        data-turn-id="request-WEB:a0b7b981-471e-4da1-b531-b34f4c1ae52f-0"
                        data-testid="conversation-turn-2"
                        data-scroll-anchor="false"
                        data-turn="assistant"
                      >
                        <h4 className="sr-only select-none">ChatGPT said:</h4>
                        <div className="@w-sm/main:[--thread-content-margin:var(--thread-content-margin-sm,calc(var(--spacing)*6))] @w-lg/main:[--thread-content-margin:var(--thread-content-margin-lg,calc(var(--spacing)*16))] mx-auto my-auto px-(--thread-content-margin) pb-10 text-base [--thread-content-margin:var(--thread-content-margin-xs,calc(var(--spacing)*4))]">
                          <div className="@w-lg/main:[--thread-content-max-width:48rem] group/turn-messages agent-turn relative mx-auto flex w-full max-w-(--thread-content-max-width) min-w-0 flex-1 flex-col [--thread-content-max-width:40rem] focus-visible:outline-hidden">
                            <div className="flex max-w-full grow flex-col gap-4">
                              <div
                                data-message-author-role="assistant"
                                data-message-id="b9e4adfc-be61-41d1-a9b6-12a7bbf57457"
                                dir="auto"
                                data-message-model-slug="gpt-5-3"
                                className="text-message keyboard-focused:focus-ring [.text-message+&amp;]:mt-1 relative flex min-h-8 w-full flex-col items-end gap-2 text-start break-words whitespace-normal outline-none"
                                data-turn-start-message="true"
                                tabIndex="0"
                              >
                                <div className="flex w-full flex-col gap-1 empty:hidden">
                                  <div className="markdown dark markdown-new-styling prose w-full wrap-break-word dark:prose-invert">
                                    <p data-start="0" data-end="241">
                                      If you want{" "}
                                      <strong data-start="12" data-end="56">
                                        trendy, fast, weeknight-friendly dinners
                                      </strong>
                                      , the current sweet spot is: high-protein,
                                      bold sauces, one-pan meals, globally
                                      inspired bowls, and “better than takeout”
                                      comfort food in under 30 minutes. Here are
                                      some strong options:
                                    </p>
                                    <h2
                                      data-section-id="1gd4dgf"
                                      data-start="243"
                                      data-end="283"
                                    >
                                      1. Crispy Chili Oil Salmon Rice Bowls
                                    </h2>
                                    <p data-start="284" data-end="352">
                                      Very popular because it feels
                                      restaurant-quality with little effort.
                                    </p>
                                    <p data-start="354" data-end="383">
                                      <strong data-start="354" data-end="363">
                                        Time:
                                      </strong>{" "}
                                      20 min
                                      <br data-start="370" data-end="373" />
                                      <strong data-start="373" data-end="381">
                                        How:
                                      </strong>
                                    </p>
                                    <ul data-start="384" data-end="521">
                                      <li
                                        data-section-id="kikt7t"
                                        data-start="384"
                                        data-end="418"
                                      >
                                        <p data-start="386" data-end="418">
                                          Roast or pan-sear salmon cubes
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="1k5cur0"
                                        data-start="419"
                                        data-end="438"
                                      >
                                        <p data-start="421" data-end="438">
                                          Serve over rice
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="9cjick"
                                        data-start="439"
                                        data-end="473"
                                      >
                                        <p data-start="441" data-end="473">
                                          Add cucumber, avocado, edamame
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="1tzxosa"
                                        data-start="474"
                                        data-end="521"
                                      >
                                        <p data-start="476" data-end="521">
                                          Drizzle chili crisp + soy sauce + mayo
                                          + lime
                                        </p>
                                      </li>
                                    </ul>
                                    <p data-start="523" data-end="556">
                                      <strong data-start="523" data-end="536">
                                        Shortcut:
                                      </strong>{" "}
                                      Use microwave rice.
                                    </p>
                                    <hr data-start="558" data-end="561" />
                                    <h2
                                      data-section-id="kj2cnl"
                                      data-start="563"
                                      data-end="600"
                                    >
                                      2. Gochujang Chicken Lettuce Wraps
                                    </h2>
                                    <p data-start="601" data-end="631">
                                      Sweet, spicy, fresh, and fast.
                                    </p>
                                    <p data-start="633" data-end="662">
                                      <strong data-start="633" data-end="642">
                                        Time:
                                      </strong>{" "}
                                      20 min
                                      <br data-start="649" data-end="652" />
                                      <strong data-start="652" data-end="660">
                                        How:
                                      </strong>
                                    </p>
                                    <ul data-start="663" data-end="800">
                                      <li
                                        data-section-id="v1s92i"
                                        data-start="663"
                                        data-end="687"
                                      >
                                        <p data-start="665" data-end="687">
                                          Brown ground chicken
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="1up9cmt"
                                        data-start="688"
                                        data-end="734"
                                      >
                                        <p data-start="690" data-end="734">
                                          Add garlic + gochujang + soy sauce +
                                          honey
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="1p43o0m"
                                        data-start="735"
                                        data-end="762"
                                      >
                                        <p data-start="737" data-end="762">
                                          Spoon into lettuce cups
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="11h1zig"
                                        data-start="763"
                                        data-end="800"
                                      >
                                        <p data-start="765" data-end="800">
                                          Top with scallions and sesame seeds
                                        </p>
                                      </li>
                                    </ul>
                                    <hr data-start="802" data-end="805" />
                                    <h2
                                      data-section-id="13spbbn"
                                      data-start="807"
                                      data-end="832"
                                    >
                                      3. Marry Me Tortellini
                                    </h2>
                                    <p data-start="833" data-end="878">
                                      A viral creamy tomato dish adapted for
                                      speed.
                                    </p>
                                    <p data-start="880" data-end="909">
                                      <strong data-start="880" data-end="889">
                                        Time:
                                      </strong>{" "}
                                      20 min
                                      <br data-start="896" data-end="899" />
                                      <strong data-start="899" data-end="907">
                                        How:
                                      </strong>
                                    </p>
                                    <ul data-start="910" data-end="1034">
                                      <li
                                        data-section-id="lft6sg"
                                        data-start="910"
                                        data-end="926"
                                      >
                                        <p data-start="912" data-end="926">
                                          Sauté garlic
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="1keutns"
                                        data-start="927"
                                        data-end="953"
                                      >
                                        <p data-start="929" data-end="953">
                                          Add sun-dried tomatoes
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="1qbdkrb"
                                        data-start="954"
                                        data-end="982"
                                      >
                                        <p data-start="956" data-end="982">
                                          Stir in cream + parmesan
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="1qndwh5"
                                        data-start="983"
                                        data-end="1020"
                                      >
                                        <p data-start="985" data-end="1020">
                                          Toss with refrigerated tortellini
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="1o5noxz"
                                        data-start="1021"
                                        data-end="1034"
                                      >
                                        <p data-start="1023" data-end="1034">
                                          Add spinach
                                        </p>
                                      </li>
                                    </ul>
                                    <hr data-start="1036" data-end="1039" />
                                    <h2
                                      data-section-id="bi3cwr"
                                      data-start="1041"
                                      data-end="1069"
                                    >
                                      4. Sheet Pan Fajita Bowls
                                    </h2>
                                    <p data-start="1070" data-end="1086">
                                      Minimal cleanup.
                                    </p>
                                    <p data-start="1088" data-end="1117">
                                      <strong data-start="1088" data-end="1097">
                                        Time:
                                      </strong>{" "}
                                      25 min
                                      <br data-start="1104" data-end="1107" />
                                      <strong data-start="1107" data-end="1115">
                                        How:
                                      </strong>
                                    </p>
                                    <ul data-start="1118" data-end="1237">
                                      <li
                                        data-section-id="swbg2g"
                                        data-start="1118"
                                        data-end="1169"
                                      >
                                        <p data-start="1120" data-end="1169">
                                          Roast sliced chicken or tofu + peppers
                                          + onions
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="182iu7m"
                                        data-start="1170"
                                        data-end="1198"
                                      >
                                        <p data-start="1172" data-end="1198">
                                          Season with fajita spice
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="1e3ri1k"
                                        data-start="1199"
                                        data-end="1237"
                                      >
                                        <p data-start="1201" data-end="1237">
                                          Serve over rice with salsa + avocado
                                        </p>
                                      </li>
                                    </ul>
                                    <hr data-start="1239" data-end="1242" />
                                    <h2
                                      data-section-id="wlmrtx"
                                      data-start="1244"
                                      data-end="1270"
                                    >
                                      5. Spicy Peanut Noodles
                                    </h2>
                                    <p data-start="1271" data-end="1320">
                                      Huge trend because pantry-friendly and
                                      addictive.
                                    </p>
                                    <p data-start="1322" data-end="1419">
                                      <strong data-start="1322" data-end="1331">
                                        Time:
                                      </strong>{" "}
                                      15 min
                                      <br data-start="1338" data-end="1341" />
                                      <strong data-start="1341" data-end="1351">
                                        Sauce:
                                      </strong>
                                      <br data-start="1351" data-end="1354" />
                                      Peanut butter + soy sauce + garlic +
                                      sriracha + lime + warm water
                                    </p>
                                    <p data-start="1421" data-end="1481">
                                      Toss with noodles and top with cucumber or
                                      shredded chicken.
                                    </p>
                                    <hr data-start="1483" data-end="1486" />
                                    <h2
                                      data-section-id="zpqxye"
                                      data-start="1488"
                                      data-end="1512"
                                    >
                                      6. Smash Burger Tacos
                                    </h2>
                                    <p data-start="1513" data-end="1551">
                                      Still very trendy and shockingly easy.
                                    </p>
                                    <p data-start="1553" data-end="1582">
                                      <strong data-start="1553" data-end="1562">
                                        Time:
                                      </strong>{" "}
                                      15 min
                                      <br data-start="1569" data-end="1572" />
                                      <strong data-start="1572" data-end="1580">
                                        How:
                                      </strong>
                                    </p>
                                    <ul data-start="1583" data-end="1720">
                                      <li
                                        data-section-id="mo6qjw"
                                        data-start="1583"
                                        data-end="1617"
                                      >
                                        <p data-start="1585" data-end="1617">
                                          Press thin beef onto tortillas
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="15paw0u"
                                        data-start="1618"
                                        data-end="1652"
                                      >
                                        <p data-start="1620" data-end="1652">
                                          Cook meat-side down in skillet
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="1cdgvx0"
                                        data-start="1653"
                                        data-end="1669"
                                      >
                                        <p data-start="1655" data-end="1669">
                                          Flip briefly
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="xgrdex"
                                        data-start="1670"
                                        data-end="1720"
                                      >
                                        <p data-start="1672" data-end="1720">
                                          Top with pickles, shredded lettuce,
                                          burger sauce
                                        </p>
                                      </li>
                                    </ul>
                                    <hr data-start="1722" data-end="1725" />
                                    <h2
                                      data-section-id="oc3wgm"
                                      data-start="1727"
                                      data-end="1761"
                                    >
                                      7. Mediterranean Chickpea Bowls
                                    </h2>
                                    <p data-start="1762" data-end="1801">
                                      Healthy trend that doesn’t feel boring.
                                    </p>
                                    <p data-start="1803" data-end="1832">
                                      <strong data-start="1803" data-end="1812">
                                        Time:
                                      </strong>{" "}
                                      15 min
                                      <br data-start="1819" data-end="1822" />
                                      <strong data-start="1822" data-end="1830">
                                        How:
                                      </strong>
                                    </p>
                                    <ul data-start="1833" data-end="1937">
                                      <li
                                        data-section-id="1673vuy"
                                        data-start="1833"
                                        data-end="1874"
                                      >
                                        <p data-start="1835" data-end="1874">
                                          Warm chickpeas with olive oil + cumin
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="6l0fgx"
                                        data-start="1875"
                                        data-end="1898"
                                      >
                                        <p data-start="1877" data-end="1898">
                                          Serve over couscous
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="n79a31"
                                        data-start="1899"
                                        data-end="1937"
                                      >
                                        <p data-start="1901" data-end="1937">
                                          Add cucumber, tomato, feta, tzatziki
                                        </p>
                                      </li>
                                    </ul>
                                    <hr data-start="1939" data-end="1942" />
                                    <h2
                                      data-section-id="cu0168"
                                      data-start="1944"
                                      data-end="1983"
                                    >
                                      8. Korean-Inspired Kimchi Fried Rice
                                    </h2>
                                    <p data-start="1984" data-end="2032">
                                      Especially relevant in Seoul—easy and
                                      excellent.
                                    </p>
                                    <p data-start="2034" data-end="2063">
                                      <strong data-start="2034" data-end="2043">
                                        Time:
                                      </strong>{" "}
                                      15 min
                                      <br data-start="2050" data-end="2053" />
                                      <strong data-start="2053" data-end="2061">
                                        How:
                                      </strong>
                                    </p>
                                    <ul data-start="2064" data-end="2161">
                                      <li
                                        data-section-id="1anqp3i"
                                        data-start="2064"
                                        data-end="2102"
                                      >
                                        <p data-start="2066" data-end="2102">
                                          Stir-fry kimchi + rice + scallions
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="17ebusb"
                                        data-start="2103"
                                        data-end="2136"
                                      >
                                        <p data-start="2105" data-end="2136">
                                          Add spam, bacon, tofu, or egg
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="8ic7bz"
                                        data-start="2137"
                                        data-end="2161"
                                      >
                                        <p data-start="2139" data-end="2161">
                                          Finish with sesame oil
                                        </p>
                                      </li>
                                    </ul>
                                    <hr data-start="2163" data-end="2166" />
                                    <h2
                                      data-section-id="7tru62"
                                      data-start="2168"
                                      data-end="2213"
                                    >
                                      My Best Picks for You (fastest + tastiest)
                                    </h2>
                                    <ol data-start="2214" data-end="2315">
                                      <li
                                        data-section-id="abp3li"
                                        data-start="2214"
                                        data-end="2236"
                                      >
                                        <p data-start="2217" data-end="2236">
                                          Kimchi fried rice
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="1qjjy0z"
                                        data-start="2237"
                                        data-end="2264"
                                      >
                                        <p data-start="2240" data-end="2264">
                                          Chili oil salmon bowls
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="1xe4vmy"
                                        data-start="2265"
                                        data-end="2293"
                                      >
                                        <p data-start="2268" data-end="2293">
                                          Gochujang chicken wraps
                                        </p>
                                      </li>
                                      <li
                                        data-section-id="5fqm9w"
                                        data-start="2294"
                                        data-end="2315"
                                      >
                                        <p data-start="2297" data-end="2315">
                                          Smash burger tacos
                                        </p>
                                      </li>
                                    </ol>
                                    <h2
                                      data-section-id="1cormlm"
                                      data-start="2317"
                                      data-end="2335"
                                    >
                                      If you tell me:
                                    </h2>
                                    <p
                                      data-start="2336"
                                      data-end="2491"
                                      data-is-last-node=""
                                      data-is-only-node=""
                                    >
                                      <strong data-start="2336" data-end="2418">
                                        1) budget, 2) protein preference, 3)
                                        calories, or 4) Korean grocery
                                        available?
                                      </strong>
                                      <br data-start="2418" data-end="2421" />
                                      …I can give you a{" "}
                                      <strong data-start="2439" data-end="2490">
                                        personalized 7-day trendy weeknight
                                        dinner plan
                                      </strong>
                                      .
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                      <div
                        aria-hidden="true"
                        className="pointer-events-none -mt-px h-px translate-y-[calc(var(--scroll-root-safe-area-inset-bottom)-14*var(--spacing))]"
                      ></div>
                      <div className="R6Vx5W_threadScrollVars pointer-events-none min-h-(--gutter-remaining-height,0px) translate-y-(--scroll-root-safe-area-inset-bottom) group-data-stream-active/scroll-root:h-[calc(var(--thread-response-height)-16*var(--spacing))]"></div>
                    </div>
                  </div>
                  <div
                    id="thread-bottom-container"
                    className="group/thread-bottom-container content-fade single-line relative sticky bottom-0 isolate z-10 flex w-full basis-auto flex-col has-data-has-thread-error:pt-2 has-data-has-thread-error:[box-shadow:var(--sharp-edge-bottom-shadow)] md:border-transparent md:pt-0 dark:border-white/20 md:dark:border-transparent print:hidden"
                  >
                    <div
                      className="relative mx-auto h-0"
                      style="--thread-scroll-to-bottom-banner-offset: 0px;"
                    >
                      <div className="absolute start-1/2 bottom-[calc(100%+6*var(--spacing)+var(--thread-scroll-to-bottom-banner-offset,0px))] z-10 flex h-0 -translate-x-1/2 items-end justify-center group-[:not([data-scroll-from-end])]/scroll-root:pointer-events-none group-[:not([data-scroll-from-end])]/scroll-root:translate-y-2 group-[:not([data-scroll-from-end])]/scroll-root:scale-50 group-[:not([data-scroll-from-end])]/scroll-root:opacity-0 group-[:not([data-scroll-from-end])]/scroll-root:delay-0 group-[:not([data-scroll-from-end])]/scroll-root:duration-100 motion-safe:transition-all motion-safe:delay-300 motion-safe:duration-300">
                        <button
                          aria-hidden="true"
                          tabIndex="-1"
                          className="btn-secondary bg-token-bg-primary/65! hover:bg-token-main-surface-secondary/75! shadow-short group-data-stream-active/scroll-root:squircle absolute relative start-1/2 bottom-[calc(100%+6*var(--spacing)+var(--thread-scroll-to-bottom-banner-offset,0px))] z-10 box-content flex h-8 w-8 -translate-x-1/2 cursor-pointer items-center justify-center overflow-hidden rounded-full outline-hidden backdrop-blur-[2px] backdrop-filter select-none *:absolute *:inset-0 *:m-auto group-data-stream-active/scroll-root:w-10 motion-safe:transition-[width] motion-safe:duration-120 motion-safe:ease-out *:motion-safe:transition-opacity *:motion-safe:duration-120 *:motion-safe:ease-out sm:shadow-md dark:shadow-none!"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            aria-hidden="true"
                            className="icon opacity-100 group-data-stream-active/scroll-root:opacity-0"
                          >
                            <use
                              href="/cdn/assets-experimental/sprites-core-d25c669f.svg#ac89a7"
                              fill="currentColor"
                            ></use>
                          </svg>
                          <span
                            aria-hidden="true"
                            className="*:bg-token-text-primary/70 absolute inset-0 flex items-center justify-center gap-0.75 opacity-0 *:h-1 *:w-1 *:rounded-full group-data-stream-active/scroll-root:opacity-100"
                          >
                            <span className="e33vkq_waveDot"></span>
                            <span className="e33vkq_waveDot"></span>
                            <span className="e33vkq_waveDot"></span>
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</dialog>;
