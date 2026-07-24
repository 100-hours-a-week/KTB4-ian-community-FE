import { describe, expect, it } from "vitest";
import { isPostOwnedByCurrentUser } from "../../src/entities/post/model/isPostOwnedByCurrentUser.js";
import { getOptionMenuPlacement } from "../../src/shared/ui/OptionMenu.jsx";

describe("isPostOwnedByCurrentUser", () => {
  it("mine=true이면 내 게시물로 판정한다", () => {
    expect(isPostOwnedByCurrentUser({ mine: true }, { userId: 2 })).toBe(true);
  });

  it("mine=false이면 다른 사용자 게시물로 판정한다", () => {
    expect(
      isPostOwnedByCurrentUser(
        { mine: false, author: { userId: 2 } },
        { userId: 2 },
      ),
    ).toBe(false);
  });

  it("mine이 없고 사용자 ID와 작성자 ID가 같으면 내 게시물로 판정한다", () => {
    expect(
      isPostOwnedByCurrentUser(
        { mine: null, author: { userId: 7 } },
        { userId: "7" },
      ),
    ).toBe(true);
  });

  it("닉네임이 같아도 ID가 다르면 다른 사용자로 판정한다", () => {
    expect(
      isPostOwnedByCurrentUser(
        { mine: null, author: { userId: 3, nickname: "같은닉네임" } },
        { userId: 4, nickname: "같은닉네임" },
      ),
    ).toBe(false);
  });

  it("소유권을 판단할 수 없으면 안전한 기본 상태를 사용한다", () => {
    expect(
      isPostOwnedByCurrentUser(
        { mine: null, author: { nickname: "작성자" } },
        { nickname: "작성자" },
      ),
    ).toBe(false);
  });
});

describe("getOptionMenuPlacement", () => {
  it("아래 공간이 충분하면 아래로 연다", () => {
    const placement = getOptionMenuPlacement(
      { top: 100, bottom: 136, right: 400 },
      { width: 1024, height: 768 },
    );
    expect(placement.direction).toBe("down");
    expect(placement.top).toBe(144);
  });

  it("아래 공간이 부족하면 위로 연다", () => {
    const placement = getOptionMenuPlacement(
      { top: 700, bottom: 736, right: 400 },
      { width: 1024, height: 768 },
    );
    expect(placement.direction).toBe("up");
    expect(placement.top).toBe(616);
  });

  it("작은 화면에서 메뉴가 좌우 Viewport를 벗어나지 않는다", () => {
    const placement = getOptionMenuPlacement(
      { top: 20, bottom: 56, right: 100 },
      { width: 180, height: 320 },
    );
    expect(placement.left).toBe(8);
  });
});
