import React, {
  useMemo,
  useState,
} from "react";

import {
  SEARCH_CATEGORIES,
  buildUnifiedSearchCatalog,
  searchUnifiedCatalog,
} from "./searchCatalogModel";

import "./searchRoute.css";

const CATEGORY_OPTIONS = Object.freeze([
  Object.freeze({
    id: SEARCH_CATEGORIES.ALL,
    label: "All",
  }),
  Object.freeze({
    id: SEARCH_CATEGORIES.NOTES,
    label: "Notes",
  }),
  Object.freeze({
    id: SEARCH_CATEGORIES.VIDEOS,
    label: "Videos",
  }),
  Object.freeze({
    id: SEARCH_CATEGORIES.MOCK_TESTS,
    label: "Mock Tests",
  }),
  Object.freeze({
    id: SEARCH_CATEGORIES.CURRENT_AFFAIRS,
    label: "Current Affairs",
  }),
  Object.freeze({
    id: SEARCH_CATEGORIES.ROADMAPS,
    label: "Roadmaps",
  }),
  Object.freeze({
    id: SEARCH_CATEGORIES.COURSES,
    label: "Courses",
  }),
  Object.freeze({
    id: SEARCH_CATEGORIES.ACCOUNT,
    label: "Account",
  }),
]);

const POPULAR_SEARCHES = Object.freeze([
  "Child Development",
  "Mock Tests",
  "Current Affairs",
  "Notes",
]);

const CATEGORY_LABELS = Object.freeze(
  Object.fromEntries(
    CATEGORY_OPTIONS.map((item) => [
      item.id,
      item.label,
    ])
  )
);

const cleanString = (value = "") =>
  String(value ?? "").trim();

const isSafeInternalRoute = (route = "") => {
  const value = cleanString(route);

  return Boolean(
    value &&
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !/[\u0000-\u001F\u007F]/.test(value)
  );
};

const getAccessLabel = (entry = {}) => {
  if (entry.isFree === true) {
    return "Free";
  }

  return (
    cleanString(entry.planLabel) ||
    cleanString(
      entry.accessRequirement?.rawPlanCode
    ) ||
    cleanString(
      entry.accessRequirement?.planCode
    ) ||
    "Access required"
  );
};

const getResultMeta = (entry = {}) =>
  [
    cleanString(entry.subject),
    cleanString(entry.chapter),
    cleanString(entry.month),
    cleanString(entry.mentorName),
  ].filter(Boolean);

const SearchResultCard = ({
  entry = {},
  onOpen,
}) => {
  const meta = getResultMeta(entry);
  const accessLabel = getAccessLabel(entry);
  const categoryLabel =
    CATEGORY_LABELS[entry.category] ||
    "Learning";

  return (
    <article
      className="searchResultCard"
      data-search-kind={entry.kind || "content"}
      data-search-category={entry.category || ""}
    >
      <div className="searchResultCardTop">
        <span className="searchResultCategory">
          {categoryLabel}
        </span>

        <span
          className={
            entry.isFree
              ? "searchAccessBadge searchAccessBadge--free"
              : "searchAccessBadge searchAccessBadge--protected"
          }
        >
          {accessLabel}
        </span>
      </div>

      <h3>{entry.title || "AspireNest Learning"}</h3>

      {entry.description ? (
        <p>{entry.description}</p>
      ) : null}

      {meta.length > 0 ? (
        <div className="searchResultMeta">
          {meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => onOpen(entry.route)}
      >
        Open
        <span aria-hidden="true">→</span>
      </button>
    </article>
  );
};

export default function SearchRoute({
  user = null,
  contentItems = [],
  roadmaps = [],
  shellState = null,
  navigate = null,
  initialQuery = "",
  initialCategory = SEARCH_CATEGORIES.ALL,
}) {
  const [query, setQuery] = useState(
    cleanString(initialQuery)
  );
  const [category, setCategory] = useState(
    cleanString(initialCategory) ||
      SEARCH_CATEGORIES.ALL
  );

  const catalog = useMemo(
    () =>
      buildUnifiedSearchCatalog({
        contentItems,
        roadmaps,
      }),
    [contentItems, roadmaps]
  );

  const search = useMemo(
    () =>
      searchUnifiedCatalog(
        catalog,
        query,
        {
          category,
        }
      ),
    [catalog, query, category]
  );

  const availableCategories = useMemo(
    () =>
      CATEGORY_OPTIONS.filter((item) => {
        if (item.id === SEARCH_CATEGORIES.ALL) {
          return true;
        }

        return (
          Number(
            catalog.categoryCounts?.[item.id]
          ) > 0
        );
      }),
    [catalog]
  );

  const isFailClosed =
    shellState?.isFailClosed === true;
  const accountLabel =
    cleanString(user?.email) ||
    "AspireNest learner";

  const handleOpen = (route = "") => {
    if (
      !isSafeInternalRoute(route) ||
      typeof navigate !== "function"
    ) {
      return;
    }

    navigate(route);
  };

  const handlePopularSearch = (value) => {
    setQuery(value);
    setCategory(SEARCH_CATEGORIES.ALL);
  };

  const handleClear = () => {
    setQuery("");
    setCategory(SEARCH_CATEGORIES.ALL);
  };

  return (
    <main
      className="searchPage"
      data-search-fail-closed={
        isFailClosed ? "true" : "false"
      }
    >
      <section className="searchHero">
        <div className="searchHeroCopy">
          <span className="searchEyebrow">
            ASPIRENEST UNIVERSAL SEARCH
          </span>

          <h1>Search your learning universe</h1>

          <p>
            Find published notes, classes, mock tests,
            current affairs, roadmaps, courses, and account
            destinations from one protected workspace.
          </p>

          <small>{accountLabel}</small>
        </div>

        <div className="searchHeroPanel">
          <label htmlFor="aspirenest-search-input">
            What are you looking for?
          </label>

          <div className="searchInputWrap">
            <span aria-hidden="true">⌕</span>
            <input
              id="aspirenest-search-input"
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search notes, mock tests, videos..."
              autoComplete="off"
            />

            {query ? (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
              >
                Clear
              </button>
            ) : null}
          </div>

          <div
            className="searchPopularRow"
            aria-label="Popular searches"
          >
            {POPULAR_SEARCHES.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() =>
                  handlePopularSearch(item)
                }
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {isFailClosed ? (
        <section
          className="searchVerificationNotice"
          role="status"
        >
          <strong>
            Access verification is temporarily unavailable.
          </strong>
          <p>
            Search remains available, but protected results
            will be verified again when opened.
          </p>
        </section>
      ) : null}

      <section className="searchWorkspace">
        <div className="searchWorkspaceHeader">
          <div>
            <span>DISCOVER</span>
            <h2>
              {search.hasQuery
                ? `Results for “${search.query}”`
                : "Browse AspireNest"}
            </h2>
          </div>

          <strong>
            {search.totalMatches}{" "}
            {search.totalMatches === 1
              ? "result"
              : "results"}
          </strong>
        </div>

        <div
          className="searchCategoryRail"
          aria-label="Search categories"
        >
          {availableCategories.map((item) => {
            const count =
              item.id === SEARCH_CATEGORIES.ALL
                ? catalog.total
                : Number(
                    catalog.categoryCounts?.[
                      item.id
                    ]
                  ) || 0;

            return (
              <button
                type="button"
                key={item.id}
                className={
                  category === item.id
                    ? "isActive"
                    : ""
                }
                aria-pressed={
                  category === item.id
                }
                onClick={() =>
                  setCategory(item.id)
                }
              >
                <span>{item.label}</span>
                <b>{count}</b>
              </button>
            );
          })}
        </div>

        {search.results.length > 0 ? (
          <div className="searchResultGrid">
            {search.results.map((entry) => (
              <SearchResultCard
                key={entry.id}
                entry={entry}
                onOpen={handleOpen}
              />
            ))}
          </div>
        ) : (
          <div className="searchEmptyState">
            <span aria-hidden="true">⌕</span>
            <h3>No matching learning content</h3>
            <p>
              Try a broader keyword or return to all
              categories.
            </p>
            <button
              type="button"
              onClick={handleClear}
            >
              Reset search
            </button>
          </div>
        )}
      </section>

      <section className="searchSafetyNote">
        <div>
          <span>PROTECTED BY ASPIRENEST ACCESS</span>
          <h2>Search discovers. Access rules decide.</h2>
        </div>

        <p>
          Search results never expose raw PDF, file, or video
          URLs. Existing learning gates verify access before
          protected content opens.
        </p>
      </section>
    </main>
  );
}
