import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    updateDoc,
  } from "firebase/firestore";

import { db } from "../../firebase";

export const duplicateMockTestAsDraft = async ({
  test,
  reloadContent,
}) => {
  if (!test?.id) {
    return false;
  }

  const clonePayload = {
    ...test,
    title: `${test.title || "Mock Test"} - Copy`,
    status: "draft",
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    clonedFrom: test.id,
  };

  delete clonePayload.id;

  await addDoc(collection(db, "contentItems"), clonePayload);

  if (typeof reloadContent === "function") {
    await reloadContent();
  }

  return true;
};

export const updateMockTestStatus = async ({
    test,
    status,
    reloadContent,
  }) => {
    if (!test?.id || !status) {
      return false;
    }
  
    await updateDoc(doc(db, "contentItems", test.id), {
      status,
      updatedAt: new Date(),
    });
  
    if (typeof reloadContent === "function") {
      await reloadContent();
    }
  
    return true;
  };
  
  export const toggleMockTestFeatured = async ({
    test,
    reloadContent,
  }) => {
    if (!test?.id) {
      return false;
    }
  
    await updateDoc(doc(db, "contentItems", test.id), {
      isFeatured: !test.isFeatured,
      updatedAt: new Date(),
    });
  
    if (typeof reloadContent === "function") {
      await reloadContent();
    }
  
    return true;
  };

  export const buildMockTestStartLink = ({
    test,
    origin = window.location.origin,
  }) => {
    if (!test?.id) {
      return "";
    }
  
    return `${origin}/ctet-tet/mock-tests/start/${test.id}`;
  };
  
  export const copyMockTestStartLink = async ({ test }) => {
    const link = buildMockTestStartLink({ test });
  
    if (!link) {
      return false;
    }
  
    await navigator.clipboard.writeText(link);
  
    return true;
  };

  export const deleteMockTest = async ({
    test,
    reloadContent,
  }) => {
    if (!test?.id) {
      return false;
    }
  
    await deleteDoc(doc(db, "contentItems", test.id));
  
    if (typeof reloadContent === "function") {
      await reloadContent();
    }
  
    return true;
  };

  const getSafeMockTestFileName = (title = "mock-test") =>
  title
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "mock-test";

export const exportMockTestJson = ({ test }) => {
  if (!test?.id) {
    return false;
  }

  const exportPayload = {
    ...test,
    exportedAt: new Date().toISOString(),
    exportedFrom: "AspireNest Academy",
  };

  const jsonBlob = new Blob(
    [JSON.stringify(exportPayload, null, 2)],
    { type: "application/json" }
  );

  const downloadUrl = URL.createObjectURL(jsonBlob);

  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = `${getSafeMockTestFileName(
    test.title || "mock-test"
  )}.json`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  URL.revokeObjectURL(downloadUrl);

  return true;
};