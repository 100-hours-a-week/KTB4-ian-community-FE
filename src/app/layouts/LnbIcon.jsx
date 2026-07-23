import {
  lnbHomeFillVector,
  lnbHomeStrokeVector,
  lnbLockBodyVector,
  lnbLockKeyVector,
  lnbLockShackleVector,
  lnbMyPageBodyVector,
  lnbMyPageHeadVector,
  lnbPlusHorizontalVector,
  lnbPlusVerticalVector,
  lnbReceiptFillVector,
  lnbReceiptStrokeVector,
} from "../../shared/assets/index.js";

function Part({ className, src }) {
  return <img className={className} src={src} alt="" aria-hidden="true" />;
}

export function LnbIcon({ name, selected = false }) {
  if (name === "home") {
    return (
      <span className="lnb-icon" aria-hidden="true">
        <Part
          className={`lnb-icon__part ${selected ? "lnb-icon__home-fill" : "lnb-icon__home-stroke"}`}
          src={selected ? lnbHomeFillVector : lnbHomeStrokeVector}
        />
      </span>
    );
  }
  if (name === "plus") {
    return (
      <span className="lnb-icon" aria-hidden="true">
        <Part
          className="lnb-icon__part lnb-icon__plus-vertical"
          src={lnbPlusVerticalVector}
        />
        <Part
          className="lnb-icon__part lnb-icon__plus-horizontal"
          src={lnbPlusHorizontalVector}
        />
      </span>
    );
  }
  if (name === "receipt") {
    return (
      <span className="lnb-icon" aria-hidden="true">
        <Part
          className="lnb-icon__part lnb-icon__receipt"
          src={selected ? lnbReceiptFillVector : lnbReceiptStrokeVector}
        />
      </span>
    );
  }
  if (name === "profile") {
    return (
      <span className="lnb-icon" aria-hidden="true">
        <Part
          className="lnb-icon__part lnb-icon__profile-head"
          src={lnbMyPageHeadVector}
        />
        <Part
          className="lnb-icon__part lnb-icon__profile-body"
          src={lnbMyPageBodyVector}
        />
      </span>
    );
  }
  return (
    <span className="lnb-icon" aria-hidden="true">
      <Part
        className="lnb-icon__part lnb-icon__lock-body"
        src={lnbLockBodyVector}
      />
      <Part
        className="lnb-icon__part lnb-icon__lock-shackle"
        src={lnbLockShackleVector}
      />
      <Part
        className="lnb-icon__part lnb-icon__lock-key"
        src={lnbLockKeyVector}
      />
    </span>
  );
}
