"use client";

import { useEffect } from "react";

/**
 * 모달/바텀시트가 열려 있는 동안 배경(body) 스크롤을 잠근다.
 * 모바일에서 모달 뒤의 게시글 등이 같이 스크롤되는(스크롤 새는) 문제를 막는다.
 *
 * 사용: 컴포넌트 최상단에서 useBodyScrollLock(모달열림여부)
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevOverscroll = body.style.overscrollBehavior;
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "contain";
    return () => {
      body.style.overflow = prevOverflow;
      body.style.overscrollBehavior = prevOverscroll;
    };
  }, [locked]);
}
