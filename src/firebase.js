import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// TODO: 파이어베이스 콘솔(https://console.firebase.google.com/)에서 프로젝트 생성 후 발급받은 키를 아래에 붙여넣으세요.
const firebaseConfig = {
  apiKey: "AIzaSyBX93EdQDsyzhVT04hxeIu3CQnStasItgw",
  authDomain: "reading-the-bible-c70be.firebaseapp.com",
  projectId: "reading-the-bible-c70be",
  storageBucket: "reading-the-bible-c70be.firebasestorage.app",
  messagingSenderId: "676783046095",
  appId: "1:676783046095:web:d90f61931f36a29d0066ba",
};

// 1. Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. 유저별 진도 데이터 가져오기 (비동기)
export const fetchUserProgress = async (userName) => {
  try {
    const docRef = doc(db, "bibleProgress", userName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        chapters: data.chapters || {},
        lastChecked: data.lastChecked || null
      };
    } else {
      return { chapters: {}, lastChecked: null };
    }
  } catch (error) {
    console.error(
      "Firebase 데이터 읽기 에러 (혹시 Rules 설정이 안되었나요?):",
      error,
    );
    return { chapters: {}, lastChecked: null };
  }
};

// 3. 유저별 진도 데이터 덮어쓰기 (비동기)
export const saveUserProgress = async (userName, chaptersData, lastChecked) => {
  try {
    const docRef = doc(db, "bibleProgress", userName);
    const dataToSave = { chapters: chaptersData, lastUpdated: new Date().toISOString() };
    if (lastChecked) {
      dataToSave.lastChecked = lastChecked;
    }
    // { merge: true } 옵션을 주면 기존 문서를 완전히 덮어쓰지 않고 명시된 필드만 합칩니다.
    await setDoc(
      docRef,
      dataToSave,
      { merge: true },
    );
  } catch (error) {
    console.error("Firebase 데이터 쓰기 에러:", error);
  }
};

// 4. 정독 계획 읽기 — config/plan 문서 하나에 날짜별 "그날까지의 끝 위치"가 담겨 있다.
//    { days: { '2026-07-13': { bookId: 'gen', chapter: 20 }, ... }, startDate: '2026-06-28' }
export const fetchPlan = async () => {
  try {
    const docSnap = await getDoc(doc(db, "config", "plan"));
    if (!docSnap.exists()) return { days: {}, startDate: null };
    const data = docSnap.data();
    return { days: data.days || {}, startDate: data.startDate || null };
  } catch (error) {
    console.error("Firebase 계획 읽기 에러:", error);
    return { days: {}, startDate: null };
  }
};

// 5. 정독 계획 저장 — 넘겨준 날짜 키만 병합된다(다른 주차는 건드리지 않음).
export const savePlanDays = async (days) => {
  const docRef = doc(db, "config", "plan");
  await setDoc(
    docRef,
    { days, lastUpdated: new Date().toISOString() },
    { merge: true },
  );
};

export { db };
