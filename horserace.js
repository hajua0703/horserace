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
            // [중요] 경기 시작 시점에 각 말에게 '오늘의 컨디션'을 부여 (0.4 ~ 0.9 사이 랜덤 스퍼트 지점)
            h.dataset.spurtPoint = (Math.random() * 0.5) + 0.4; 
        });

        const timer = setInterval(() => {
            horses.forEach(horse => {
                let currentPos = parseFloat(horse.style.left);
                const horseId = horse.id.replace('horse', '');
                
                if (currentPos < trackWidth) {
                    let progress = currentPos / trackWidth;
                    let move = 0;

                    // 이전에 저장한 '오늘의 랜덤 스퍼트 지점'을 가져옵니다.
                    let mySpurtPoint = parseFloat(horse.dataset.spurtPoint);

                    if (progress < 0.3) {
                        // [초반] 순수 랜덤 (누가 치고 나갈지 모름)
                        move = Math.random() * 10; 
                    } else if (progress < mySpurtPoint) {
                        // [중반] 기본 속도 + 약간의 랜덤 가속
                        move = (Math.random() * 11) + (Math.random() * 3);
                    } else {
                        // [후반 개별 스퍼트]
                        let distanceToFinish = trackWidth - currentPos;
                        
                        // 1. 추격 보너스 (제곱근으로 뒤처진 말에게 기회 부여)
                        let catchUpBonus = Math.pow(distanceToFinish / 80, 2); 

                        // 2. 실시간 로또 스퍼트 (매 프레임 5% 확률로 터짐)
                        // 특정 말이 정해진 게 아니라, 달리는 매 순간 확률을 계산합니다.
                        let realTimeLuck = Math.random() > 0.95 ? (Math.random() * 40 + 20) : 0;

                        // 3. 선두의 저주 (지침 현상) - 매 프레임 확률 계산
                        let fatigue = (progress > 0.85 && Math.random() > 0.92) ? -30 : 0;

                        move = (Math.random() * 8) + catchUpBonus + realTimeLuck + fatigue;
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