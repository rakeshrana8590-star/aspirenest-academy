import {
    addDoc,
    collection,
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