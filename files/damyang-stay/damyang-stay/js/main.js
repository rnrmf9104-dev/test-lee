/* ==========================================================
   죽향재 자바스크립트
   [수정 가이드] 기능별로 함수가 나뉘어 있어 필요 없는 기능은
   맨 아래 init 호출 한 줄만 지우면 됩니다.
   ========================================================== */

/* 1) 헤더: 스크롤하면 배경색이 생김 + 현재 섹션 메뉴 강조 */
function initHeader() {
  const header = document.getElementById('header');
  const links = document.querySelectorAll('.nav a');
  const sections = [...links].map(a => document.querySelector(a.getAttribute('href')));
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 60); // 60px 넘으면 배경 표시
    const pos = window.scrollY + 120;                          // 현재 위치 계산(보정값 120)
    sections.forEach((sec, i) => {
      const on = sec.offsetTop <= pos && sec.offsetTop + sec.offsetHeight > pos;
      links[i].classList.toggle('active', on);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* 2) 메뉴 클릭 시 해당 섹션으로 부드럽게 이동 (고정 헤더 높이만큼 보정) + 모바일 메뉴 토글 */
function initNav() {
  const nav = document.getElementById('nav');
  const btn = document.getElementById('menuToggle');
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const h = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 68;
      window.scrollTo({ top: target.offsetTop - (target.id === 'home' ? 0 : h - 1), behavior: 'smooth' });
      nav.classList.remove('open'); // 이동 후 모바일 메뉴 닫기
      btn.setAttribute('aria-expanded', false);
    });
  });
}

/* 3) 스크롤 시 이미지/텍스트가 자연스럽게 나타남 (.reveal 요소에 .show 추가) */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('show')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('show'); io.unobserve(en.target); } });
  }, { threshold: 0.15 });
  items.forEach(el => io.observe(el));
}

/* 4) ROOM/DAMYANG 카드: 터치 기기는 hover가 없으므로 탭하면 정보 표시 */
function initCards() {
  document.querySelectorAll('.room-card').forEach(card => {
    card.addEventListener('click', () => card.classList.toggle('open'));
  });
}

/* 5) SPACE 슬라이드: 버튼, 점, 자동재생(5초), 스와이프 지원
   [수정 가이드] 자동재생 간격은 INTERVAL(ms) 값 변경 */
function initSlider() {
  const slider = document.getElementById('slider');
  const track = slider.querySelector('.slides');
  const total = slider.querySelectorAll('.slide').length;
  const dotsBox = slider.querySelector('.dots');
  const INTERVAL = 5000;
  let idx = 0, timer;

  for (let i = 0; i < total; i++) {                 // 슬라이드 수만큼 점 자동 생성
    const d = document.createElement('button');
    d.setAttribute('aria-label', (i + 1) + '번 슬라이드');
    d.addEventListener('click', () => { go(i); restart(); });
    dotsBox.appendChild(d);
  }
  const dots = dotsBox.querySelectorAll('button');

  function go(n) {
    idx = (n + total) % total;                       // 처음/끝에서 순환
    track.style.transform = `translateX(-${idx * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('on', i === idx));
  }
  function restart() { clearInterval(timer); timer = setInterval(() => go(idx + 1), INTERVAL); }

  slider.querySelector('.prev').addEventListener('click', () => { go(idx - 1); restart(); });
  slider.querySelector('.next').addEventListener('click', () => { go(idx + 1); restart(); });

  let startX = 0;                                    // 모바일 좌우 스와이프
  slider.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) { go(idx + (dx < 0 ? 1 : -1)); restart(); }
  });
  go(0); restart();
}

/* 6) 이미지 로드 실패 시 대체 처리: 깨진 이미지 아이콘 대신 베이지 배경만 표시
   [수정 가이드] 이미지는 index.html의 <img src="..."> 주소만 바꾸면 교체됩니다
   (내 이미지는 images 폴더를 만들어 src="images/파일명.jpg" 로 지정) */
function initImageFallback() {
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => { img.style.visibility = 'hidden'; });
  });
}

/* 7) 예약 문의 폼: 입력 확인(체크아웃이 체크인보다 늦어야 함) 후 박 수 안내
   [수정 가이드] 실제 전송은 서버/외부 폼 서비스 연결이 필요합니다. 연결 지점은 아래 TODO */
function initForm() {
  const form = document.getElementById('resForm');
  const msg = document.getElementById('formMsg');
  const today = new Date().toISOString().split('T')[0];
  form.checkin.min = form.checkout.min = today;      // 지난 날짜 선택 방지
  form.addEventListener('submit', e => {
    e.preventDefault();
    msg.classList.add('error');
    if (!form.name.value.trim() || !form.tel.value.trim() || !form.checkin.value || !form.checkout.value) {
      msg.textContent = '이름, 연락처, 날짜를 모두 입력해 주세요.'; return;
    }
    const nights = (new Date(form.checkout.value) - new Date(form.checkin.value)) / 86400000;
    if (nights < 1) { msg.textContent = '체크아웃은 체크인 다음 날 이후로 선택해 주세요.'; return; }
    // TODO: 여기에 fetch()로 서버 전송 코드를 추가
    msg.classList.remove('error');
    msg.textContent = `${form.room.value} ${nights}박 문의가 접수되었습니다. (예시 화면)`;
    form.reset();
  });
}

/* 실행: 페이지가 준비되면 각 기능 시작 */
document.addEventListener('DOMContentLoaded', () => {
  initHeader(); initNav(); initReveal(); initCards(); initSlider(); initImageFallback(); initForm();
});
