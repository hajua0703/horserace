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
        startBtn.innerText = '레이싱 중...';

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

                    // [개인화 극대화] 스퍼트 시작점을 0.5(절반)에서 0.9(직전)까지 아주 크게 분산
                    // 말 번호마다 완전히 다른 운명을 가집니다.
                    let horseSeed = (parseInt(horseId) * 17) % 40; 
                    let mySpurtPoint = 0.5 + (horseSeed / 100); 

                    if (progress < 0.4) {
                        move = Math.random() * 15; 
                    } else if (progress < mySpurtPoint) {
                        // 스퍼트 전까지는 적당히 따라가는 중반 페이스
                        let rubberBand = (trackWidth - currentPos) / trackWidth * 5;
                        move = (Math.random() * 11) + rubberBand;
                    } else {
                        // [개별 대역전] 여기서부터는 말마다 터지는 타이밍이 다름!
                        let distanceToFinish = trackWidth - currentPos;
                        
                        // 뒤처진 말일수록 더 '미친듯이' 달려드는 보너스 (제곱근 활용)
                        let catchUpBonus = Math.pow(distanceToFinish / 70, 2.2); 

                        // 7% 확률로 터지는 초필살기 (이동 거리 대폭 상승)
                        let superSpurt = Math.random() > 0.93 ? 35 : 0; 

                        // 선두권이 지칠 확률도 더 높임 (0.9 지점 통과 시)
                        let fatigue = (progress > 0.9 && Math.random() > 0.65) ? -25 : 0;

                        move = (Math.random() * 9) + catchUpBonus + superSpurt + fatigue;
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