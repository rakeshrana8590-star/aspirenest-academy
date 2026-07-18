import React from "react";

const cleanText = (value = "") =>
  String(value ?? "").trim();

const textFromPayload = (payload = {}) =>
  cleanText(
    payload.text ||
      payload.body ||
      payload.content ||
      payload.description ||
      payload.explanation
  );

const normalizeItems = (payload = {}) => {
  const source =
    payload.items ||
    payload.points ||
    payload.options ||
    payload.steps ||
    [];

  return Array.isArray(source)
    ? source
    : [];
};

function ReaderCallout({
  type,
  title,
  children,
}) {
  return (
    <aside
      className={`intelliTextCallout intelliTextCallout--${type.toLowerCase()}`}
    >
      <strong>{title}</strong>
      <div>{children}</div>
    </aside>
  );
}

function ReaderTable({ payload = {} }) {
  const headers = Array.isArray(
    payload.headers
  )
    ? payload.headers
    : [];
  const rows = Array.isArray(payload.rows)
    ? payload.rows
    : [];

  if (rows.length === 0) {
    return (
      <p className="intelliTextBlockFallback">
        {textFromPayload(payload) ||
          "Table content is not available."}
      </p>
    );
  }

  return (
    <div className="intelliTextTableScroll">
      <table>
        {headers.length > 0 ? (
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={`${cleanText(header)}-${index}`}>
                  {cleanText(header)}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}

        <tbody>
          {rows.map((row, rowIndex) => {
            const cells = Array.isArray(row)
              ? row
              : Object.values(row || {});

            return (
              <tr key={`row-${rowIndex}`}>
                {cells.map((cell, cellIndex) => (
                  <td key={`cell-${rowIndex}-${cellIndex}`}>
                    {cleanText(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReaderImage({ payload = {}, type }) {
  const source = cleanText(
    payload.src ||
      payload.url ||
      payload.imageUrl
  );
  const safeSource =
    source.startsWith("https://")
      ? source
      : "";

  return (
    <figure className="intelliTextVisualBlock">
      {safeSource ? (
        <img
          src={safeSource}
          alt={
            cleanText(payload.alt) ||
            `${type.toLowerCase()} visual`
          }
          loading="lazy"
        />
      ) : (
        <div className="intelliTextVisualPlaceholder">
          {type}
        </div>
      )}

      {cleanText(
        payload.caption ||
          payload.description
      ) ? (
        <figcaption>
          {cleanText(
            payload.caption ||
              payload.description
          )}
        </figcaption>
      ) : null}
    </figure>
  );
}

export default function IntelliTextBlockRenderer({
  block,
}) {
  const type = cleanText(
    block?.type
  ).toUpperCase();
  const payload = block?.payload || {};
  const text = textFromPayload(payload);
  const items = normalizeItems(payload);

  switch (type) {
    case "HEADING":
      return (
        <h2 className="intelliTextBlockHeading">
          {cleanText(
            payload.title || text
          )}
        </h2>
      );

    case "PARAGRAPH":
      return (
        <p className="intelliTextBlockParagraph">
          {text}
        </p>
      );

    case "BULLET_LIST":
      return (
        <ul className="intelliTextBlockList">
          {items.map((item, index) => (
            <li key={`${cleanText(item)}-${index}`}>
              {cleanText(
                typeof item === "object"
                  ? item.text ||
                      item.label ||
                      JSON.stringify(item)
                  : item
              )}
            </li>
          ))}
        </ul>
      );

    case "DEFINITION":
      return (
        <ReaderCallout
          type={type}
          title={
            cleanText(payload.term) ||
            "Definition"
          }
        >
          <p>
            {cleanText(
              payload.definition || text
            )}
          </p>
        </ReaderCallout>
      );

    case "EXAMPLE":
    case "EXAM_POINT":
    case "MENTOR_TIP":
    case "COMMON_MISTAKE":
    case "REVISION_BOX":
    case "SUMMARY":
      return (
        <ReaderCallout
          type={type}
          title={
            cleanText(payload.title) ||
            type
              .split("_")
              .map(
                (part) =>
                  part.charAt(0) +
                  part.slice(1).toLowerCase()
              )
              .join(" ")
          }
        >
          {items.length > 0 ? (
            <ul>
              {items.map((item, index) => (
                <li key={`${cleanText(item)}-${index}`}>
                  {cleanText(
                    typeof item === "object"
                      ? item.text ||
                          item.label ||
                          JSON.stringify(item)
                      : item
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>{text}</p>
          )}
        </ReaderCallout>
      );

    case "COMPARISON":
    case "TABLE":
      return <ReaderTable payload={payload} />;

    case "FORMULA":
      return (
        <div className="intelliTextFormula">
          <code>
            {cleanText(
              payload.formula || text
            )}
          </code>
          {cleanText(payload.explanation) ? (
            <p>
              {cleanText(
                payload.explanation
              )}
            </p>
          ) : null}
        </div>
      );

    case "IMAGE":
    case "DIAGRAM":
    case "FLOWCHART":
      return (
        <ReaderImage
          payload={payload}
          type={type}
        />
      );

    case "TIMELINE":
      return (
        <ol className="intelliTextTimeline">
          {items.map((item, index) => (
            <li key={`timeline-${index}`}>
              <strong>
                {cleanText(
                  item?.label ||
                    item?.date ||
                    `Step ${index + 1}`
                )}
              </strong>
              <span>
                {cleanText(
                  item?.text ||
                    item?.description ||
                    item
                )}
              </span>
            </li>
          ))}
        </ol>
      );

    case "MCQ":
      return (
        <section className="intelliTextPracticeBlock">
          <strong>
            {cleanText(
              payload.question ||
                payload.title ||
                "Check your understanding"
            )}
          </strong>
          <ol>
            {items.map((item, index) => (
              <li key={`option-${index}`}>
                {cleanText(
                  typeof item === "object"
                    ? item.text ||
                        item.label
                    : item
                )}
              </li>
            ))}
          </ol>
        </section>
      );

    case "PRACTICE_SET":
      return (
        <section className="intelliTextPracticeBlock">
          <strong>
            {cleanText(payload.title) ||
              "Practice Set"}
          </strong>
          <ol>
            {items.map((item, index) => (
              <li key={`practice-${index}`}>
                {cleanText(
                  typeof item === "object"
                    ? item.question ||
                        item.text ||
                        item.label
                    : item
                )}
              </li>
            ))}
          </ol>
        </section>
      );

    default:
      return (
        <div
          className="intelliTextBlockFallback"
          role="note"
        >
          This approved learning block is not available in this reader version.
        </div>
      );
  }
}
