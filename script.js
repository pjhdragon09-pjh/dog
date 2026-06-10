const dogImage = document.getElementById("dogImage");
const loading = document.getElementById("loading");
const newDogBtn = document.getElementById("newDogBtn");
const downloadBtn = document.getElementById("downloadBtn");
const slideshowBtn = document.getElementById("slideshowBtn");
const barkBtn = document.getElementById("barkBtn");
const intervalInput = document.getElementById("intervalInput");
const dogCountElem = document.getElementById("dogCount");
const likeBtn = document.getElementById("likeBtn");
const gallery = document.getElementById("gallery");
const clearBtn = document.getElementById("clearBtn");

const infoBox = document.getElementById("infoBox");
const breedName = document.getElementById("breedName");
const breedTrait = document.getElementById("breedTrait");

let currentImageUrl = "";
let slideshowTimer = null;

// 로컬 스토리지에서 조회수 데이터 가져오기
let viewCount = localStorage.getItem("dogViewCount") ? parseInt(localStorage.getItem("dogViewCount")) : 0;
dogCountElem.textContent = viewCount;

// 로컬 스토리지에서 좋아요 한 강아지 목록 가져오기
let likedDogs = localStorage.getItem("likedDogs") ? JSON.parse(localStorage.getItem("likedDogs")) : [];

// 실행 시 초기 세팅
updateGallery();
getDogImage();

// API 통신을 통해 강아지 사진 및 품종 특징 가져오는 함수
async function getDogImage() {
  loading.textContent = "강아지 사진을 불러오는 중...";
  likeBtn.textContent = "🤍";

  try {
    const response = await fetch("https://api.thedogapi.com/v1/images/search");
    const data = await response.json();
    
    currentImageUrl = data[0].url;
    dogImage.src = currentImageUrl;

    const breedInfo = data[0].breeds && data[0].breeds[0] ? data[0].breeds[0] : null;

    dogImage.onload = () => {
      loading.textContent = "사진 불러오기 완료!";
      
      if (likedDogs.includes(currentImageUrl)) {
        likeBtn.textContent = "❤️";
      }

      if (breedInfo) {
        breedName.textContent = breedInfo.name;
        breedTrait.textContent = breedInfo.temperament ? breedInfo.temperament : "온순하고 영리한 성격입니다.";
      } else {
        breedName.textContent = "귀여운 믹스견 친구 🐶";
        breedTrait.textContent = "사람을 좋아하고 애교가 넘쳐나는 귀염둥이입니다.";
      }

      // 슬라이드쇼 진행 여부에 따라 정보창 On/Off
      if (slideshowTimer) {
        infoBox.classList.add("hidden");
      } else {
        infoBox.classList.remove("hidden");
      }

      viewCount++;
      dogCountElem.textContent = viewCount;
      localStorage.setItem("dogViewCount", viewCount);
    };

  } catch (error) {
    console.error("API 로드 실패, 대체 강아지 소스 작동");
    const randomId = Math.floor(Math.random() * 50) + 1;
    currentImageUrl = `https://placedog.net/500/500?id=${randomId}`;
    dogImage.src = currentImageUrl;
    
    dogImage.onload = () => {
      loading.textContent = "백업 강아지 사진을 불러왔습니다.";
      breedName.textContent = "사랑스러운 강아지";
      breedTrait.textContent = "주인을 잘 따르며 장난기가 매우 많습니다.";
      
      if (slideshowTimer) infoBox.classList.add("hidden");
      else infoBox.classList.remove("hidden");
      
      viewCount++;
      dogCountElem.textContent = viewCount;
    };
  }
}

// Web Audio API 기반 오디오 멍멍 주파수 합성 함수
function playBarkSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'sawtooth';
  
  osc.frequency.setValueAtTime(320, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.15);

  gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.18);
}

// 슬라이드쇼 재생/정지 제어 함수
function toggleSlideshow() {
  if (slideshowTimer) {
    clearInterval(slideshowTimer);
    slideshowTimer = null;
    slideshowBtn.textContent = "▶️ 슬라이드쇼 시작";
    slideshowBtn.classList.remove("active");
    infoBox.classList.remove("hidden"); // 정지 시 정보창 다시 노출
  } else {
    let seconds = parseInt(intervalInput.value);
    if (isNaN(seconds) || seconds < 1) seconds = 3;
    
    slideshowBtn.textContent = "⏸️ 슬라이드쇼 중지";
    slideshowBtn.classList.add("active");
    infoBox.classList.add("hidden"); // 시작 시 정보창 숨김
    
    slideshowTimer = setInterval(getDogImage, seconds * 1000);
  }
}

// 이미지 파일 다운로드 처리 함수
async function downloadImage() {
  if (!currentImageUrl || loading.textContent.includes("중")) return;
  
  const originalText = downloadBtn.textContent;
  try {
    downloadBtn.textContent = "⏳ 다운로드 준비 중...";
    const response = await fetch(currentImageUrl);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `cute_dog_${Date.now()}.jpg`; 
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
    
    downloadBtn.textContent = "✅ 저장 완료!";
    setTimeout(() => downloadBtn.textContent = originalText, 1500);
  } catch (error) {
    window.open(currentImageUrl, '_blank');
    downloadBtn.textContent = originalText;
  }
}

// 하트(좋아요) 토글 이벤트 설정
likeBtn.addEventListener("click", () => {
  if (!currentImageUrl || loading.textContent.includes("중")) return;

  if (likedDogs.includes(currentImageUrl)) {
    likedDogs = likedDogs.filter(url => url !== currentImageUrl);
    likeBtn.textContent = "🤍";
  } else {
    likedDogs.push(currentImageUrl);
    likeBtn.textContent = "❤️";
  }

  localStorage.setItem("likedDogs", JSON.stringify(likedDogs));
  updateGallery();
});

// 하단 좋아요 갤러리 갱신 함수
function updateGallery() {
  gallery.innerHTML = "";

  if (likedDogs.length === 0) {
    gallery.innerHTML = `<div class="empty-msg">아직 좋아요 한 사진이 없습니다.<br>하트를 눌러보세요!</div>`;
    return;
  }

  likedDogs.slice().reverse().forEach(url => {
    const img = document.createElement("img");
    img.src = url;
    img.className = "gallery-item";
    
    img.addEventListener("click", () => {
      if (slideshowTimer) toggleSlideshow(); 
      
      dogImage.src = url;
      currentImageUrl = url;
      likeBtn.textContent = "❤️";
      loading.textContent = "저장된 사진을 보고 있습니다.";
      
      breedName.textContent = "보관함 속 강아지 💖";
      breedTrait.textContent = "내가 직접 하트를 눌러 수집한 소중한 파트너입니다.";
      infoBox.classList.remove("hidden");
    });

    gallery.appendChild(img);
  });
}

// 전체 삭제 버튼 이벤트
clearBtn.addEventListener("click", () => {
  if (confirm("좋아요 목록을 모두 삭제하시겠습니까?")) {
    likedDogs = [];
    localStorage.setItem("likedDogs", JSON.stringify(likedDogs));
    updateGallery();
    likeBtn.textContent = "🤍";
  }
});

// 이벤트 리스너 바인딩 그룹
newDogBtn.addEventListener("click", () => {
  if (slideshowTimer) toggleSlideshow(); 
  getDogImage();
});

slideshowBtn.addEventListener("click", toggleSlideshow);
barkBtn.addEventListener("click", playBarkSound);
downloadBtn.addEventListener("click", downloadImage);
