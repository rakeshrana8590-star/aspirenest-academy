import {
  buildAccessProductFormFromRecord,
  buildAccessProductFormPayload,
  createInitialAccessProductForm,
  describeCatalogValidity,
  getPlanProductIdPreview,
  normalizePlanCodeDraft,
  parseBundleItemIds,
  validateAccessProductForm,
} from "./accessProductFormModel";

import {
  ACCESS_PLAN_VALIDITY_MODES,
} from "../accessPlanCatalog";

import {
  ACCESS_SCOPE_TYPES,
} from "../accessConstants";

describe("Admin dynamic access product form model", () => {
  test("initial plan form is admin-defined and not fixed to 365 days", () => {
    const form =
      createInitialAccessProductForm();

    expect(form.validityMode).toBe(
      ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED
    );
    expect(form.defaultValidityDays).toBe("");
    expect(form.allowNoExpiry).toBe(true);
  });

  test("plan code draft is normalized for admin entry", () => {
    expect(
      normalizePlanCodeDraft(
        "ctet crash-45"
      )
    ).toBe("CTET_CRASH_45");
  });

  test("product ID preview is deterministic", () => {
    expect(
      getPlanProductIdPreview({
        planCode: "CTET_CRASH_45",
        productId: "",
      })
    ).toBe("plan_ctet_crash_45");
  });

  test("custom plan requires access rank", () => {
    const form = {
      ...createInitialAccessProductForm(),
      title: "CTET Crash 45",
      planCode: "CTET_CRASH_45",
      accessRank: "",
      price: "799",
    };

    expect(
      validateAccessProductForm(
        form
      )
    ).toContain(
      "Custom plan requires an explicit access rank."
    );
  });

  test("custom plan payload persists price, rank, and admin validity", () => {
    const payload =
      buildAccessProductFormPayload({
        ...createInitialAccessProductForm(),
        title: "CTET Crash 45",
        planCode: "CTET_CRASH_45",
        accessRank: "150",
        price: "799",
        compareAtPrice: "999",
        defaultValidityDays: "",
      });

    expect(payload).toMatchObject({
      productId:
        "plan_ctet_crash_45",
      planCode: "CTET_CRASH_45",
      planType: "CTET_CRASH_45",
      accessRank: 150,
      priceINR: 799,
      compareAtPriceINR: 999,
      validityMode:
        ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
      defaultValidityDays: null,
      allowNoExpiry: true,
      fixed365DayValidity: false,
    });
  });

  test("admin may choose an optional default duration", () => {
    const payload =
      buildAccessProductFormPayload({
        ...createInitialAccessProductForm(),
        title: "Premium",
        planCode: "PREMIUM",
        accessRank: "200",
        price: "1499",
        defaultValidityDays: "180",
      });

    expect(
      payload.defaultValidityDays
    ).toBe(180);
    expect(payload.validityDays).toBe(180);
  });

  test("negative price is rejected", () => {
    const form = {
      ...createInitialAccessProductForm(),
      title: "Invalid",
      price: "-1",
    };

    expect(
      validateAccessProductForm(
        form
      )
    ).toContain(
      "Price cannot be negative."
    );
  });

  test("bundle item IDs accept lines, commas, and numbered text", () => {
    expect(
      parseBundleItemIds(
        "1. one\n2) two, three"
      )
    ).toEqual([
      "one",
      "two",
      "three",
    ]);
  });

  test("non-plan item payload remains backward compatible", () => {
    const payload =
      buildAccessProductFormPayload({
        ...createInitialAccessProductForm(),
        title: "Exact Mock",
        scopeType:
          ACCESS_SCOPE_TYPES.ITEM,
        module: "mockTest",
        itemType: "mockTest",
        itemId: "mock-1",
        validityDays: "30",
        price: "199",
      });

    expect(payload).toMatchObject({
      scopeType:
        ACCESS_SCOPE_TYPES.ITEM,
      module: "mockTest",
      itemType: "mockTest",
      itemId: "mock-1",
      validityDays: 30,
      price: 199,
    });
  });

  test("editing a plan preserves stable product identity and price version", () => {
    const form =
      buildAccessProductFormFromRecord({
        id: "plan_ctet_crash",
        productId:
          "plan_ctet_crash",
        scopeType: "plan",
        planCode: "CTET_CRASH",
        title: "Crash Batch",
        accessRank: 150,
        priceINR: 799,
        priceVersion: 3,
        defaultValidityDays: null,
        allowNoExpiry: true,
      });

    expect(form.productId).toBe(
      "plan_ctet_crash"
    );
    expect(form.planCode).toBe(
      "CTET_CRASH"
    );
    expect(form.priceVersion).toBe(3);
  });

  test("validity description explains admin choice", () => {
    expect(
      describeCatalogValidity({
        scopeType: "plan",
        defaultValidityDays: null,
        allowNoExpiry: true,
      })
    ).toBe(
      "Admin decides per grant • no-expiry allowed"
    );
  });

  test("plan catalog rejects non-admin validity mode", () => {
    const form = {
      ...createInitialAccessProductForm(),
      title: "Invalid validity",
      validityMode:
        ACCESS_PLAN_VALIDITY_MODES.NO_EXPIRY,
    };

    expect(
      validateAccessProductForm(
        form
      )
    ).toContain(
      "Plan catalog validity must stay admin-defined."
    );
  });
});
