// 1. Supabase 설정 (본인의 URL과 Anon Key 입력)
const trackWidth = trackArea.clientWidth - 100; // 트랙 전체 너비에서 말 크기만큼 뺌
const _supabase = supabase.createClient('https://zwgznwoywgvlyujbmdwx.supabase.co', 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z3pud295d2d2bHl1amJtZHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NTEyNTMsImV4cCI6MjA4MTUyNzI1M30.m_7wSDQZLNFgJzY5Xq4HcJbCJmRyp9D4s4wTWtNp0Mc')

// 2. 경기 결과 DB에 저장하기
async function saveResultToSupabase(ranks) {
    const { data, error } = await _supabase
        .from('race_results')
        .insert([
            { 
                round: currentRound, 
                ranks: ranks.join(', ') 
            }
        ]);
    
    if (error) console.error('저장 실패:', error);
    else loadHistory(); // 저장 후 목록 새로고침
}

// 3. 기록판 불러오기
async function loadHistory() {
    const { data, error } = await _supabase
        .from('race_results')
        .select('*')
        .order('created_at', { ascending: false });

    const historyList = document.getElementById('history-list');
    historyList.innerHTML = ''; // 기존 목록 초기화
    
    data.forEach(row => {
        const li = document.createElement('li');
        li.innerText = `${row.round}R 결과: ${row.ranks}`;
        historyList.appendChild(li);
    });
}

// 페이지 시작 시 기존 기록 로드
loadHistory();