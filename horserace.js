// 1. Supabase 설정
const SUPABASE_URL = 'https://zwgznwoywgvlyujbmdwx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z3pud295d2d2bHl1amJtZHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NTEyNTMsImV4cCI6MjA4MTUyNzI1M30.m_7wSDQZLNFgJzY5Xq4HcJbCJmRyp9D4s4wTWtNp0Mc';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const trackArea = document.getElementById('track-area');
const startBtn = document.getElementById('start-btn');
const recordBody = document.getElementById('record-body'); // 표 본문 ID
const horseCount = 10;
let isRacing = false;

// 2. 말 생성 및 초기화
function initHorses() {
    trackArea.innerHTML = ''; // 기존 트랙 초기화

    // 🚩 피니시 라인 생성 코드 추가
    const finishLine = document.createElement('div');
    finishLine.className = 'finish-line';
    trackArea.appendChild(finishLine);

    for (let i = 1; i <= horseCount; i++) {
        const lane = document.createElement('div');
        lane.className = 'lane';
        lane.innerHTML = `
            <div class="horse" id="horse${i}" style="left: 0px;">
                <div class="horse-container">
                    <span class="horse-number">${i}</span>
                    <img src="말${i}.png" class="horse-img">
                </div>
            </div>`;
        trackArea.appendChild(lane);
    }
}


// 4. 경기 결과 저장
async function saveResultToSupabase(ranks) {
    const { count } = await _supabase.from('race_results').select('*', { count: 'exact', head: true });
    const nextRound = (count || 0) + 1;

    const { error } = await _supabase
        .from('race_results')
        .insert([{ round: nextRound, ranks: ranks.join(', ') }]);

    if (error) {
        console.error('저장 실패:', error);
    } else {
        alert(`🏁 경기 종료! ${nextRound}라운드 결과가 저장되었습니다.`);
        loadHistory();
    }
    isRacing = false;
    startBtn.disabled = false;
}

// 5. 경기 시작 로직
if (startBtn) {
    startBtn.onclick = () => {
        if (isRacing) return;
        isRacing = true;
        startBtn.disabled = true;

        const horses = document.querySelectorAll('.horse');
        const trackWidth = trackArea.clientWidth - 120;
        let finishedHorses = [];

        horses.forEach((h) => h.style.left = '0px');

        const timer = setInterval(() => {
            horses.forEach(horse => {
                let currentPos = parseFloat(horse.style.left);
                
                if (currentPos < trackWidth) {
                    let progress = currentPos / trackWidth;
                    let move = 0;

                    if (progress < 0.6) {
                        move = Math.random() * 13; 
                    } else {
                        let rankBonus = (trackWidth - currentPos) / trackWidth * 15;
                        let isSpurt = Math.random() > 0.85; 
                        move = (Math.random() * 6) + (isSpurt ? 18 + rankBonus : 0);
                    }
                    
                    let newPos = currentPos + move;
                    if (newPos > trackWidth) newPos = trackWidth;
                    horse.style.left = newPos + 'px';

                    const horseId = horse.id.replace('horse', '');
                    if (newPos >= trackWidth && !finishedHorses.includes(horseId)) {
                        finishedHorses.push(horseId);
                    }
                }
            });

            if (finishedHorses.length === 10) {
                clearInterval(timer);
                saveResultToSupabase(finishedHorses);
            }
        }, 50);
    };
}

initHorses();
loadHistory();