import { useEffect, useState } from "react";
import {
  apiAssetUrl,
  DEFAULT_PROFILE_PATH,
} from "../../../shared/config/env.js";

export function UserAvatar({ profileImage, nickname = "사용자", size = 34 }) {
  const fallback = apiAssetUrl(DEFAULT_PROFILE_PATH);
  const [source, setSource] = useState(() => apiAssetUrl(profileImage));
  const [didFallback, setDidFallback] = useState(false);
  useEffect(() => {
    setSource(apiAssetUrl(profileImage));
    setDidFallback(false);
  }, [profileImage]);
  return (
    <img
      className="user-avatar"
      src={source}
      alt={`${nickname} 프로필`}
      width={size}
      height={size}
      onError={(event) => {
        if (didFallback || source === fallback) {
          event.currentTarget.onerror = null;
          return;
        }
        setDidFallback(true);
        setSource(fallback);
      }}
    />
  );
}
