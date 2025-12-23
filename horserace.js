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
        
        // 경기 종료 후 1초 뒤에 말들을 제자리로 보냅니다.
        setTimeout(() => {
            resetRace();
        }, 1000);
    }
}

// 5. 경기 시작 로직
if (startBtn) {
    startBtn.onclick = () => {
        if (isRacing) return;
        isRacing = true;
        startBtn.disabled = true;

        const horses = document.querySelectorAll('.horse');
        const trackWidth = trackArea.clientWidth - 100; 
        let finishedHorses = [];

        horses.forEach((h) => {
            h.style.transition = 'none';
            h.style.left = '0px';
        });

        const timer = setInterval(() => {
            horses.forEach(horse => {
                let currentPos = parseFloat(horse.style.left);
                const horseId = horse.id.replace('horse', '');
                
                if (currentPos < trackWidth) {
                    let progress = currentPos / trackWidth;
                    let move = 0;

                    // [개별 설정] 말마다 스퍼트가 터지는 시점을 다르게 계산 (0.7 ~ 0.85 사이)
                    let horseSeed = (parseInt(horseId) * 13) % 15; 
                    let mySpurtPoint = 0.7 + (horseSeed / 100); 

                    if (progress < 0.4) {
                        // [초반] 무난한 출발
                        move = Math.random() * 10; 
                    } else {
                        // [후반] 각자 다른 타이밍에 터지는 ★개별 대역전 구간★
                        
                        // 1. 하이퍼 추격 보너스: 거리가 멀수록 제곱으로 가속
                        let distanceToFinish = trackWidth - currentPos;
                        let catchUpBonus = Math.pow(distanceToFinish / 90, 1.8); 

                        // 2. 랜덤 폭발력: 매 순간이 아니라 4%의 낮은 확률로 아주 강하게 (45px)
                        let superSpurt = Math.random() > 0.96 ? 45 : 0; 

                        // 3. 선두의 저주: 결승선 직전에서 지칠 확률
                        let fatigue = (progress > 0.92 && Math.random() > 0.7) ? -20 : 0;

                        move = (Math.random() * 8) + catchUpBonus + superSpurt + fatigue;
                    }
                    
                    let newPos = currentPos + move;

                    if (newPos <= currentPos) newPos = currentPos + 1; 
                    if (newPos > trackWidth) newPos = trackWidth;
                    
                    horse.style.left = newPos + 'px';

                    if (newPos >= trackWidth && !finishedHorses.includes(horseId)) {
                        finishedHorses.push(horseId);
                    }
                }
            });

            if (finishedHorses.length === horses.length) {
                clearInterval(timer);
                saveResultToSupabase(finishedHorses);
            }
        }, 40); 
    };
}

initHorses();
loadHistory();