import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import {
  buildMockTestFormFromTest,
  buildMockTestQuestionsFormFromTest,
} from "./mockTestFormUtils.js";

import {
  duplicateMockTestAsDraft,
  updateMockTestStatus,
  toggleMockTestFeatured,
  copyMockTestStartLink,
  deleteMockTest,
  exportMockTestJson,
  exportMockTestCsv,
  exportMockTestExcel,
  exportMockTestXlsx,
} from "./mockTestAdminActions.js";

export default function MockTestActionMenu({
  position,
  test,
  onClose,
  reloadContent,
  setEditingMockTestId,
  setMockTestForm,
  setMockTestQuestionsForm,
}) {
  const navigate = useNavigate();

  if (!position || !test) {
    return null;
  }

  return createPortal(
    <div className="mockPortalBackdrop" onClick={onClose}>
      <div
        className="mockPortalMenu"
        style={{
          position: "fixed",
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 999999,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={() => {
            if (!test?.id) return;

            setEditingMockTestId(test.id);
            setMockTestForm(buildMockTestFormFromTest(test));
            setMockTestQuestionsForm(
              buildMockTestQuestionsFormFromTest(test)
            );

            onClose();

            localStorage.removeItem("reusedQuestionForMockTest");

            navigate(`/admin/content/mock-tests/add?editId=${test.id}`);
          }}
        >
          ✏ Edit
        </button>

        <div className="mockPortalMenuDivider" />

        <button
          onClick={async () => {
            const confirmClone = window.confirm(
              `Create a duplicate copy of "${test.title}" as Draft?`
            );

            if (!confirmClone) return;

            await duplicateMockTestAsDraft({
              test,
              reloadContent,
            });

            onClose();
            alert("Mock test duplicated as Draft ✅");
          }}
        >
          📋 Duplicate
        </button>

        <div className="mockPortalMenuDivider" />

        <button
  onClick={async () => {
    const nextStatus =
      test.status === "published" ? "unpublished" : "published";

    if (nextStatus === "published") {
      const confirmText = window.prompt(
        `Publish "${test.title || "this mock test"}" to student side?\n\n` +
          `Published tests may become visible to eligible students based on plan access.\n\n` +
          `Type PUBLISH to confirm.`
      );

      if (confirmText !== "PUBLISH") {
        alert("Publish cancelled. Mock test was not published.");
        onClose();
        return;
      }
    } else {
      const confirmUnpublish = window.confirm(
        `Unpublish "${test.title || "this mock test"}"?\n\n` +
          `Students will no longer see this test.`
      );

      if (!confirmUnpublish) {
        return;
      }
    }

    await updateMockTestStatus({
      test,
      status: nextStatus,
      reloadContent,
    });

    onClose();

    alert(
      nextStatus === "published"
        ? "Mock test published ✅"
        : "Mock test unpublished ✅"
    );
  }}
>
  🚀 Publish / Unpublish
</button>

        <button
          onClick={async () => {
            await toggleMockTestFeatured({
              test,
              reloadContent,
            });

            onClose();

            alert(
              !test.isFeatured
                ? "Mock test marked as featured ⭐"
                : "Mock test removed from featured"
            );
          }}
        >
          ⭐ Feature / Remove Feature
        </button>

        {test.status === "archived" ? (
          <button
            onClick={async () => {
              if (!test?.id) return;

              const confirmRestore = window.confirm(
                `Restore "${test.title}" back to Unpublished?`
              );

              if (!confirmRestore) return;

              await updateMockTestStatus({
                test,
                status: "unpublished",
                reloadContent,
                extraFields: {
                  restoredAt: new Date(),
                },
              });

              onClose();

              alert("Mock test restored successfully ✅");
            }}
          >
            📂 Restore / Unarchive
          </button>
        ) : (
          <button
            onClick={async () => {
              if (!test?.id) return;

              const confirmArchive = window.confirm(
                `Archive "${test.title}"?\n\nArchived tests stay saved in admin but should not appear to students.`
              );

              if (!confirmArchive) return;

              await updateMockTestStatus({
                test,
                status: "archived",
                reloadContent,
                extraFields: {
                  archivedAt: new Date(),
                },
              });

              onClose();

              alert("Mock test archived successfully ✅");
            }}
          >
            📦 Archive
          </button>
        )}

        <div className="mockPortalMenuDivider" />

        <button
          onClick={async () => {
            const copied = await copyMockTestStartLink({
              test,
            });

            onClose();

            alert(
              copied
                ? "Mock test link copied ✅"
                : "Unable to copy mock test link"
            );
          }}
        >
          🔗 Copy Link
        </button>

        <button
          onClick={() => {
            const exported = exportMockTestJson({
              test,
            });

            onClose();

            alert(
              exported
                ? "Mock test JSON exported ✅"
                : "Unable to export mock test JSON"
            );
          }}
        >
          📤 Export JSON
        </button>

        <button
          type="button"
          onClick={() => {
            const exported = exportMockTestCsv({
              test,
            });

            onClose();

            alert(
              exported
                ? "Mock test CSV exported ✅"
                : "No questions found for CSV export"
            );
          }}
        >
          📊 Export CSV
        </button>

        <button
          type="button"
          onClick={() => {
            const exported = exportMockTestExcel({
              test,
            });

            onClose();

            alert(
              exported
                ? "Mock test Excel exported ✅"
                : "No questions found for Excel export"
            );
          }}
        >
          📗 Export Excel
        </button>

        <button
          type="button"
          onClick={() => {
            const exported = exportMockTestXlsx({
              test,
            });

            onClose();

            alert(
              exported
                ? "Mock test XLSX exported ✅"
                : "No questions found for XLSX export"
            );
          }}
        >
          📘 Export XLSX
        </button>

        <div className="mockPortalMenuDivider" />

        <button
  className="dangerMenuButton"
  onClick={async () => {
    if (!test?.id) return;

    const confirmText = window.prompt(
      `Danger Zone: Delete "${test.title || "this mock test"}" permanently?\n\n` +
        `This action cannot be undone.\n\n` +
        `Type DELETE to confirm.`
    );

    if (confirmText !== "DELETE") {
      alert("Delete cancelled. No mock test was deleted.");
      onClose();
      return;
    }

    await deleteMockTest({
      test,
      reloadContent,
    });

    onClose();
    alert("Mock test deleted permanently ✅");
  }}
>
  🗑 Delete
</button>
      </div>
    </div>,
    document.body
  );
}