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
      return docSnap.data().chapters || {};
    } else {
      return {}; // 데이터가 없으면 빈 객체 리턴
    }
  } catch (error) {
    console.error(
      "Firebase 데이터 읽기 에러 (혹시 Rules 설정이 안되었나요?):",
      error,
    );
    return {};
  }
};

// 3. 유저별 진도 데이터 덮어쓰기 (비동기)
export const saveUserProgress = async (userName, chaptersData) => {
  try {
    const docRef = doc(db, "bibleProgress", userName);
    // { merge: true } 옵션을 주면 기존 문서를 완전히 덮어쓰지 않고 명시된 필드만 합칩니다.
    await setDoc(
      docRef,
      { chapters: chaptersData, lastUpdated: new Date().toISOString() },
      { merge: true },
    );
  } catch (error) {
    console.error("Firebase 데이터 쓰기 에러:", error);
  }
};

export { db };
