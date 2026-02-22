/**
 * ========================================
 * 数独大师 - Android 版
 * ========================================
 * 
 * 模块结构:
 * 1. Config   - 配置模块 (主题、难度)
 * 2. State    - 状态管理
 * 3. Sudoku   - 数独引擎 (生成、验证、求解)
 * 4. Storage  - 本地存储封装 (SQLite + localStorage)
 * 5. Database - SQLite 数据库模块 (Capacitor)
 * 6. UI       - 界面渲染
 * 7. Game     - 游戏主控
 */

// Capacitor SQLite 导入
let sqliteConnection = null;
let db = null;
const isNativePlatform = () => {
    return typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
};

// ========================================
// 配置模块 Config
// ========================================
const Config = {
    // 6套主题配色定义
    themes: {
        neon: {
            '--bg-primary': '#0f0f23',
            '--bg-secondary': '#1a1a2e',
            '--bg-tertiary': '#16213e',
            '--accent-primary': '#00d9ff',
            '--accent-secondary': '#ff00ff',
            '--text-primary': '#ffffff',
            '--text-secondary': '#b0b0b0',
            '--cell-bg': '#0f3460',
            '--cell-hover': '#1a5490',
            '--cell-selected': '#00d9ff',
            '--cell-related': '#1a3a5c',
            '--cell-same': '#2a4a7c',
            '--conflict': '#ff4757',
            '--fixed': '#ffd700',
            '--success': '#2ed573'
        },
        ocean: {
            '--bg-primary': '#001f3f',
            '--bg-secondary': '#003d7a',
            '--bg-tertiary': '#0055a4',
            '--accent-primary': '#00ccff',
            '--accent-secondary': '#0099cc',
            '--text-primary': '#ffffff',
            '--text-secondary': '#a0d8ef',
            '--cell-bg': '#004080',
            '--cell-hover': '#0059b3',
            '--cell-selected': '#00ccff',
            '--cell-related': '#003366',
            '--cell-same': '#004d99',
            '--conflict': '#ff6b6b',
            '--fixed': '#ffd93d',
            '--success': '#6bcf7f'
        },
        forest: {
            '--bg-primary': '#1a2f1a',
            '--bg-secondary': '#2d4a2d',
            '--bg-tertiary': '#3d5c3d',
            '--accent-primary': '#90ee90',
            '--accent-secondary': '#32cd32',
            '--text-primary': '#ffffff',
            '--text-secondary': '#b8d4b8',
            '--cell-bg': '#2f4f2f',
            '--cell-hover': '#3d6b3d',
            '--cell-selected': '#90ee90',
            '--cell-related': '#264026',
            '--cell-same': '#365c36',
            '--conflict': '#ff6b6b',
            '--fixed': '#ffd700',
            '--success': '#7cfc00'
        },
        sunset: {
            '--bg-primary': '#2d1f3d',
            '--bg-secondary': '#4a2c4a',
            '--bg-tertiary': '#6b3d5c',
            '--accent-primary': '#ff6b6b',
            '--accent-secondary': '#feca57',
            '--text-primary': '#ffffff',
            '--text-secondary': '#e8d5e8',
            '--cell-bg': '#5d3d5d',
            '--cell-hover': '#7d4d7d',
            '--cell-selected': '#ff6b6b',
            '--cell-related': '#4a2c4a',
            '--cell-same': '#6b3d6b',
            '--conflict': '#ff4757',
            '--fixed': '#ffd700',
            '--success': '#26de81'
        },
        dark: {
            '--bg-primary': '#0a0a0a',
            '--bg-secondary': '#1a1a1a',
            '--bg-tertiary': '#2a2a2a',
            '--accent-primary': '#888888',
            '--accent-secondary': '#555555',
            '--text-primary': '#e0e0e0',
            '--text-secondary': '#888888',
            '--cell-bg': '#1f1f1f',
            '--cell-hover': '#2f2f2f',
            '--cell-selected': '#666666',
            '--cell-related': '#151515',
            '--cell-same': '#252525',
            '--conflict': '#ff4444',
            '--fixed': '#cccccc',
            '--success': '#44aa44'
        },
        pink: {
            '--bg-primary': '#2d1f2d',
            '--bg-secondary': '#4a2c4a',
            '--bg-tertiary': '#6b3d6b',
            '--accent-primary': '#ff69b4',
            '--accent-secondary': '#ff1493',
            '--text-primary': '#ffffff',
            '--text-secondary': '#f0d0f0',
            '--cell-bg': '#5d3d5d',
            '--cell-hover': '#7d4d7d',
            '--cell-selected': '#ff69b4',
            '--cell-related': '#4a2c4a',
            '--cell-same': '#6b3d6b',
            '--conflict': '#ff4757',
            '--fixed': '#ffd700',
            '--success': '#ff69b4'
        }
    },

    // 难度设置：需要移除的数字数量（空格数）
    difficulties: {
        easy: { emptyCells: 35, label: '简单' },
        medium: { emptyCells: 45, label: '中等' },
        hard: { emptyCells: 55, label: '困难' },
        expert: { emptyCells: 64, label: '专家' }
    },

    // 获取主题配置
    getTheme(themeName) {
        return this.themes[themeName] || this.themes.neon;
    },

    // 获取难度配置
    getDifficulty(diffName) {
        return this.difficulties[diffName] || this.difficulties.easy;
    },

    // 获取所有主题名称
    getThemeNames() {
        return Object.keys(this.themes);
    },

    // 获取所有难度名称
    getDifficultyNames() {
        return Object.keys(this.difficulties);
    }
};

// ========================================
// 状态管理模块 State
// ========================================
const State = {
    // 玩家信息
    currentPlayer: '',
    currentTheme: 'neon',
    currentDifficulty: 'easy',

    // 游戏数据
    board: [],           // 当前棋盘（0表示空格）
    solution: [],        // 完整答案
    fixedCells: [],      // 哪些格子是固定的（初始给定的）

    // 交互状态
    selectedCell: null,  // {r, c} 或 null

    // 计时器
    timer: 0,            // 当前秒数
    timerInterval: null, // setInterval 引用
    victoryTime: 0,      // 完成时的用时

    // 初始化/重置方法
    init() {
        this.currentPlayer = '';
        this.currentTheme = 'neon';
        this.currentDifficulty = 'easy';
        this.resetGame();
    },

    resetGame() {
        this.board = [];
        this.solution = [];
        this.fixedCells = [];
        this.selectedCell = null;
        this.timer = 0;
        this.victoryTime = 0;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    // 设置当前玩家
    setPlayer(name) {
        this.currentPlayer = name;
    },

    // 设置主题
    setTheme(theme) {
        if (Config.getThemeNames().includes(theme)) {
            this.currentTheme = theme;
            return true;
        }
        return false;
    },

    // 设置难度
    setDifficulty(diff) {
        if (Config.getDifficultyNames().includes(diff)) {
            this.currentDifficulty = diff;
            return true;
        }
        return false;
    },

    // 设置选中格子
    selectCell(r, c) {
        this.selectedCell = { r, c };
    },

    // 清除选中
    clearSelection() {
        this.selectedCell = null;
    },

    // 获取选中格子
    getSelectedCell() {
        return this.selectedCell;
    },

    // 检查格子是否被选中
    isSelected(r, c) {
        return this.selectedCell && 
               this.selectedCell.r === r && 
               this.selectedCell.c === c;
    },

    // 设置棋盘值
    setCellValue(r, c, value) {
        if (this.isValidPosition(r, c)) {
            this.board[r][c] = value;
            return true;
        }
        return false;
    },

    // 获取棋盘值
    getCellValue(r, c) {
        if (this.isValidPosition(r, c)) {
            return this.board[r][c];
        }
        return null;
    },

    // 检查格子是否固定
    isFixed(r, c) {
        if (this.isValidPosition(r, c)) {
            return this.fixedCells[r][c];
        }
        return false;
    },

    // 设置格子为固定
    setFixed(r, c, fixed = true) {
        if (this.isValidPosition(r, c)) {
            this.fixedCells[r][c] = fixed;
            return true;
        }
        return false;
    },

    // 检查位置是否有效
    isValidPosition(r, c) {
        return r >= 0 && r < 9 && c >= 0 && c < 9;
    },

    // 开始计时
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.timerInterval = setInterval(() => {
            this.timer++;
        }, 1000);
    },

    // 停止计时
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    // 获取格式化时间
    getFormattedTime() {
        const m = Math.floor(this.timer / 60).toString().padStart(2, '0');
        const s = (this.timer % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    },

    // 检查是否完成（所有格子填满且正确）
    isComplete() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] === 0 || this.board[r][c] !== this.solution[r][c]) {
                    return false;
                }
            }
        }
        return true;
    },

    // 检查特定格子是否有冲突
    hasConflict(r, c) {
        const val = this.board[r][c];
        if (val === 0) return false;

        // 检查行
        for (let i = 0; i < 9; i++) {
            if (i !== c && this.board[r][i] === val) return true;
        }

        // 检查列
        for (let i = 0; i < 9; i++) {
            if (i !== r && this.board[i][c] === val) return true;
        }

        // 检查3x3宫格
        const boxR = Math.floor(r / 3) * 3;
        const boxC = Math.floor(c / 3) * 3;
        for (let i = boxR; i < boxR + 3; i++) {
            for (let j = boxC; j < boxC + 3; j++) {
                if ((i !== r || j !== c) && this.board[i][j] === val) return true;
            }
        }

        return false;
    },

    // 获取所有冲突的格子
    getAllConflicts() {
        const conflicts = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] !== 0 && this.hasConflict(r, c)) {
                    conflicts.push({ r, c });
                }
            }
        }
        return conflicts;
    }
};

// ========================================
// 数独引擎模块 Sudoku
// ========================================
const Sudoku = {
    // 生成完整的数独解
    generate() {
        // 使用标准模板
        const base = [
            [1, 2, 3, 4, 5, 6, 7, 8, 9],
            [4, 5, 6, 7, 8, 9, 1, 2, 3],
            [7, 8, 9, 1, 2, 3, 4, 5, 6],
            [2, 3, 4, 5, 6, 7, 8, 9, 1],
            [5, 6, 7, 8, 9, 1, 2, 3, 4],
            [8, 9, 1, 2, 3, 4, 5, 6, 7],
            [3, 4, 5, 6, 7, 8, 9, 1, 2],
            [6, 7, 8, 9, 1, 2, 3, 4, 5],
            [9, 1, 2, 3, 4, 5, 6, 7, 8]
        ];

        let board = base.map(row => [...row]);

        // 随机打乱行（在每个3行带内）
        for (let band = 0; band < 3; band++) {
            const rows = this.shuffle([0, 1, 2].map(i => band * 3 + i));
            const bandRows = rows.map(r => board[r]);
            for (let i = 0; i < 3; i++) {
                board[band * 3 + i] = bandRows[i];
            }
        }

        // 随机打乱列（在每个3列栈内）
        for (let stack = 0; stack < 3; stack++) {
            const cols = this.shuffle([0, 1, 2].map(i => stack * 3 + i));
            board = board.map(row => {
                const newRow = [...row];
                for (let i = 0; i < 3; i++) {
                    newRow[stack * 3 + i] = row[cols[i]];
                }
                return newRow;
            });
        }

        // 随机打乱3行带
        const bandOrder = this.shuffle([0, 1, 2]);
        let newBoard = Array(9).fill().map(() => Array(9).fill(0));
        for (let r = 0; r < 9; r++) {
            const newR = bandOrder[Math.floor(r / 3)] * 3 + (r % 3);
            newBoard[newR] = [...board[r]];
        }
        board = newBoard;

        // 随机打乱3列栈
        const stackOrder = this.shuffle([0, 1, 2]);
        newBoard = Array(9).fill().map(() => Array(9).fill(0));
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const newC = stackOrder[Math.floor(c / 3)] * 3 + (c % 3);
                newBoard[r][newC] = board[r][c];
            }
        }
        board = newBoard;

        // 随机映射数字 (1-9 重新排列)
        const nums = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        return board.map(row => row.map(n => nums[n - 1]));
    },

    // 从完整解创建谜题（移除指定数量的数字）
    createPuzzle(solution, emptyCount) {
        const puzzle = solution.map(row => [...row]);
        const fixed = Array(9).fill().map(() => Array(9).fill(true));
        
        let removed = 0;
        let attempts = 0;
        const maxAttempts = emptyCount * 3;
        
        while (removed < emptyCount && attempts < maxAttempts) {
            const r = Math.floor(Math.random() * 9);
            const c = Math.floor(Math.random() * 9);
            
            if (puzzle[r][c] !== 0) {
                puzzle[r][c] = 0;
                fixed[r][c] = false;
                removed++;
            }
            attempts++;
        }
        
        return { puzzle, fixed };
    },

    // 检查在指定位置放置数字是否有效
    isValidPlacement(board, r, c, num) {
        // 检查行
        for (let i = 0; i < 9; i++) {
            if (i !== c && board[r][i] === num) return false;
        }
        
        // 检查列
        for (let i = 0; i < 9; i++) {
            if (i !== r && board[i][c] === num) return false;
        }
        
        // 检查3x3宫格
        const boxR = Math.floor(r / 3) * 3;
        const boxC = Math.floor(c / 3) * 3;
        for (let i = boxR; i < boxR + 3; i++) {
            for (let j = boxC; j < boxC + 3; j++) {
                if ((i !== r || j !== c) && board[i][j] === num) return false;
            }
        }
        
        return true;
    },

    // 使用回溯法求解数独（验证唯一解）
    solve(board) {
        const solution = board.map(row => [...row]);
        
        const findEmpty = () => {
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (solution[r][c] === 0) return { r, c };
                }
            }
            return null;
        };
        
        const solveRecursive = () => {
            const empty = findEmpty();
            if (!empty) return true; // 全部填满，解决成功
            
            const { r, c } = empty;
            
            for (let num = 1; num <= 9; num++) {
                if (this.isValidPlacement(solution, r, c, num)) {
                    solution[r][c] = num;
                    
                    if (solveRecursive()) return true;
                    
                    solution[r][c] = 0; // 回溯
                }
            }
            
            return false;
        };
        
        const success = solveRecursive();
        return success ? solution : null;
    },

    // 检查数独是否有唯一解（简化版：只要能解出即可）
    hasUniqueSolution(board) {
        return this.solve(board) !== null;
    },

    // 获取提示：找一个空格子填入正确答案
    getHint(board, solution) {
        // 优先找只有一个可能数字的格子
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    return { r, c, value: solution[r][c] };
                }
            }
        }
        return null; // 没有空格子
    },

    // 获取某格子的所有可能值
    getPossibleValues(board, r, c) {
        if (board[r][c] !== 0) return [];
        
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (this.isValidPlacement(board, r, c, num)) {
                possible.push(num);
            }
        }
        return possible;
    },

    // 计算解题进度（已填格子数 / 总格子数）
    getProgress(board) {
        let filled = 0;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] !== 0) filled++;
            }
        }
        return Math.round((filled / 81) * 100);
    },

    // 辅助方法：随机打乱数组
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
};

// ========================================
// 数据库模块 Database (SQLite)
// ========================================
const Database = {
    async init() {
        if (!isNativePlatform()) {
            console.log('Not native platform, using localStorage');
            return false;
        }
        
        try {
            // 动态导入 SQLite 模块
            const sqliteModule = await import('@capacitor-community/sqlite');
            const { CapacitorSQLite } = sqliteModule;
            
            sqliteConnection = new CapacitorSQLite();
            
            // 创建/打开数据库
            const ret = await sqliteConnection.createConnection({
                database: 'sudoku_db',
                encrypted: false,
                mode: 'no-encryption',
                version: 1
            });
            
            db = ret.connection;
            await db.open();
            
            // 创建表
            await this.createTables();
            console.log('SQLite initialized successfully');
            return true;
        } catch (error) {
            console.error('SQLite init failed:', error);
            return false;
        }
    },

    async createTables() {
        // 排行榜表
        await db.execute(`
            CREATE TABLE IF NOT EXISTS leaderboard (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                difficulty TEXT NOT NULL,
                name TEXT NOT NULL,
                time INTEGER NOT NULL,
                date TEXT NOT NULL
            )
        `);
        
        // 个人最佳表
        await db.execute(`
            CREATE TABLE IF NOT EXISTS personal_best (
                difficulty TEXT PRIMARY KEY,
                time INTEGER NOT NULL
            )
        `);
        
        // 主题设置表
        await db.execute(`
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        `);
        
        // 存档表（游戏进度）
        await db.execute(`
            CREATE TABLE IF NOT EXISTS game_save (
                player TEXT PRIMARY KEY,
                difficulty TEXT NOT NULL,
                board TEXT NOT NULL,
                solution TEXT NOT NULL,
                fixed_cells TEXT NOT NULL,
                timer INTEGER NOT NULL,
                saved_at TEXT NOT NULL
            )
        `);
    },

    // 排行榜操作
    async getLeaderboard(difficulty) {
        if (!db) return Storage.getLeaderboard(difficulty);
        
        try {
            const result = await db.query(`
                SELECT name, time, date FROM leaderboard 
                WHERE difficulty = ? 
                ORDER BY time ASC 
                LIMIT 20
            `, [difficulty]);
            
            return result.values || [];
        } catch (error) {
            console.error('getLeaderboard error:', error);
            return Storage.getLeaderboard(difficulty);
        }
    },

    async addScore(difficulty, name, time) {
        if (!db) return Storage.addScore(difficulty, name, time);
        
        try {
            const date = new Date().toLocaleDateString();
            await db.run(`
                INSERT INTO leaderboard (difficulty, name, time, date) 
                VALUES (?, ?, ?, ?)
            `, [difficulty, name, time, date]);
            
            return this.getRank(difficulty, time);
        } catch (error) {
            console.error('addScore error:', error);
            return Storage.addScore(difficulty, name, time);
        }
    },

    async getRank(difficulty, time) {
        if (!db) return Storage.getRank(difficulty, time);
        
        try {
            const result = await db.query(`
                SELECT COUNT(*) as count FROM leaderboard 
                WHERE difficulty = ? AND time < ?
            `, [difficulty, time]);
            
            const count = result.values?.[0]?.count || 0;
            const total = await db.query(`
                SELECT COUNT(*) as count FROM leaderboard 
                WHERE difficulty = ?
            `, [difficulty]);
            
            const totalCount = total.values?.[0]?.count || 0;
            
            if (count < 20 || totalCount < 20) {
                return count + 1;
            }
            return 0;
        } catch (error) {
            return Storage.getRank(difficulty, time);
        }
    },

    // 个人最佳
    async getPersonalBests() {
        if (!db) return Storage.getPersonalBests();
        
        try {
            const result = await db.query('SELECT difficulty, time FROM personal_best');
            const bests = {};
            (result.values || []).forEach(row => {
                bests[row.difficulty] = row.time;
            });
            return bests;
        } catch (error) {
            return Storage.getPersonalBests();
        }
    },

    async updatePersonalBest(difficulty, time) {
        if (!db) return Storage.updatePersonalBest(difficulty, time);
        
        try {
            const existing = await db.query(
                'SELECT time FROM personal_best WHERE difficulty = ?',
                [difficulty]
            );
            
            const currentBest = existing.values?.[0]?.time;
            
            if (!currentBest || time < currentBest) {
                await db.run(`
                    INSERT OR REPLACE INTO personal_best (difficulty, time) 
                    VALUES (?, ?)
                `, [difficulty, time]);
                return true;
            }
            return false;
        } catch (error) {
            return Storage.updatePersonalBest(difficulty, time);
        }
    },

    // 主题设置
    async getSavedTheme() {
        if (!db) return Storage.getSavedTheme();
        
        try {
            const result = await db.query(
                "SELECT value FROM settings WHERE key = 'theme'"
            );
            return result.values?.[0]?.value || 'neon';
        } catch (error) {
            return Storage.getSavedTheme();
        }
    },

    async saveTheme(theme) {
        if (!db) return Storage.saveTheme(theme);
        
        try {
            await db.run(`
                INSERT OR REPLACE INTO settings (key, value) 
                VALUES ('theme', ?)
            `, [theme]);
        } catch (error) {
            Storage.saveTheme(theme);
        }
    },

    // 游戏存档（新功能）
    async saveGame(player, gameData) {
        if (!db) {
            // 回退到 localStorage
            localStorage.setItem(`sudoku_game_${player}`, JSON.stringify(gameData));
            return;
        }
        
        try {
            await db.run(`
                INSERT OR REPLACE INTO game_save 
                (player, difficulty, board, solution, fixed_cells, timer, saved_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                player,
                gameData.difficulty,
                JSON.stringify(gameData.board),
                JSON.stringify(gameData.solution),
                JSON.stringify(gameData.fixedCells),
                gameData.timer,
                new Date().toISOString()
            ]);
        } catch (error) {
            console.error('saveGame error:', error);
            localStorage.setItem(`sudoku_game_${player}`, JSON.stringify(gameData));
        }
    },

    async loadGame(player) {
        if (!db) {
            const data = localStorage.getItem(`sudoku_game_${player}`);
            return data ? JSON.parse(data) : null;
        }
        
        try {
            const result = await db.query(
                'SELECT * FROM game_save WHERE player = ?',
                [player]
            );
            
            if (!result.values || result.values.length === 0) return null;
            
            const row = result.values[0];
            return {
                player: row.player,
                difficulty: row.difficulty,
                board: JSON.parse(row.board),
                solution: JSON.parse(row.solution),
                fixedCells: JSON.parse(row.fixed_cells),
                timer: row.timer
            };
        } catch (error) {
            console.error('loadGame error:', error);
            const data = localStorage.getItem(`sudoku_game_${player}`);
            return data ? JSON.parse(data) : null;
        }
    },

    async deleteGame(player) {
        if (!db) {
            localStorage.removeItem(`sudoku_game_${player}`);
            return;
        }
        
        try {
            await db.run('DELETE FROM game_save WHERE player = ?', [player]);
        } catch (error) {
            localStorage.removeItem(`sudoku_game_${player}`);
        }
    }
};

// ========================================
// 存储模块 Storage (localStorage 回退)
// ========================================
const Storage = {
    // 存储键名前缀
    prefix: 'sudoku_',

    // 获取排行榜
    getLeaderboard(difficulty) {
        const key = `${this.prefix}${difficulty}`;
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch {
            return [];
        }
    },

    // 添加成绩到排行榜
    addScore(difficulty, name, time) {
        const leaderboard = this.getLeaderboard(difficulty);
        leaderboard.push({
            name: name,
            time: time,
            date: new Date().toLocaleDateString()
        });
        
        // 按时间排序，保留前20名
        leaderboard.sort((a, b) => a.time - b.time);
        if (leaderboard.length > 20) {
            leaderboard.length = 20;
        }
        
        const key = `${this.prefix}${difficulty}`;
        localStorage.setItem(key, JSON.stringify(leaderboard));
        
        return this.getRank(difficulty, time);
    },

    // 获取排名
    getRank(difficulty, time) {
        const leaderboard = this.getLeaderboard(difficulty);
        const rank = leaderboard.findIndex(entry => entry.time > time);
        if (rank === -1) {
            // 比所有记录都慢，但如果榜单未满也可以上榜
            return leaderboard.length < 20 ? leaderboard.length + 1 : 0;
        }
        return rank + 1;
    },

    // 获取个人最佳成绩
    getPersonalBests() {
        const key = `${this.prefix}personal`;
        try {
            return JSON.parse(localStorage.getItem(key)) || {};
        } catch {
            return {};
        }
    },

    // 更新个人最佳
    updatePersonalBest(difficulty, time) {
        const bests = this.getPersonalBests();
        if (!bests[difficulty] || time < bests[difficulty]) {
            bests[difficulty] = time;
            const key = `${this.prefix}personal`;
            localStorage.setItem(key, JSON.stringify(bests));
            return true; // 更新了
        }
        return false; // 未更新
    },

    // 获取主题设置
    getSavedTheme() {
        const key = `${this.prefix}theme`;
        return localStorage.getItem(key) || 'neon';
    },

    // 保存主题设置
    saveTheme(theme) {
        const key = `${this.prefix}theme`;
        localStorage.setItem(key, theme);
    },

    // 清除所有数据（调试用）
    clearAll() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    }
};

// ========================================
// UI 渲染模块
// ========================================
const UI = {
    // 初始化
    async init() {
        // 初始化数据库
        await Database.init();
        
        await this.loadSavedTheme();
        this.bindEvents();
    },

    // 加载保存的主题
    async loadSavedTheme() {
        const savedTheme = await Database.getSavedTheme();
        State.setTheme(savedTheme);
        this.applyTheme(savedTheme);
        document.querySelectorAll('#loginScreen .theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === savedTheme);
        });
    },

    // 应用主题
    applyTheme(themeName) {
        const theme = Config.getTheme(themeName);
        Object.entries(theme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });
        Storage.saveTheme(themeName);
    },

    // 渲染数独棋盘
    renderBoard() {
        const boardEl = document.getElementById('board');
        boardEl.innerHTML = '';
        
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                const value = State.getCellValue(r, c);
                if (value !== 0) {
                    cell.textContent = value;
                    if (State.isFixed(r, c)) {
                        cell.classList.add('fixed');
                    }
                }
                
                cell.onclick = () => Game.selectCell(r, c);
                boardEl.appendChild(cell);
            }
        }
    },

    // 更新选中格高亮
    updateSelection(r, c) {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'related', 'same-number');
            const cr = parseInt(cell.dataset.row);
            const cc = parseInt(cell.dataset.col);
            const val = State.getCellValue(r, c);
            
            // 选中格
            if (cr === r && cc === c) {
                cell.classList.add('selected');
            }
            // 相关格（同行、同列、同宫）
            else if (cr === r || cc === c || 
                     (Math.floor(cr/3) === Math.floor(r/3) && Math.floor(cc/3) === Math.floor(c/3))) {
                cell.classList.add('related');
            }
            
            // 相同数字
            if (val !== 0 && State.getCellValue(cr, cc) === val && (cr !== r || cc !== c)) {
                cell.classList.add('same-number');
            }
        });
    },

    // 更新冲突显示
    updateConflicts() {
        document.querySelectorAll('.cell.conflict').forEach(c => c.classList.remove('conflict'));
        const conflicts = State.getAllConflicts();
        conflicts.forEach(({r, c}) => {
            const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
            if (cell) cell.classList.add('conflict');
        });
    },

    // 更新计时器显示
    updateTimer() {
        document.getElementById('timer').textContent = State.getFormattedTime();
    },

    // 更新个人最佳显示
    async updatePersonalBests() {
        const bests = await Database.getPersonalBests();
        Config.getDifficultyNames().forEach(diff => {
            const time = bests[diff];
            const el = document.getElementById(`best-${diff}`);
            if (el) el.textContent = time ? this.formatTime(time) : '-';
        });
    },

    // 渲染排行榜
    async renderLeaderboard(difficulty) {
        const list = document.getElementById('leaderboardList');
        const leaderboard = await Database.getLeaderboard(difficulty);
        
        if (leaderboard.length === 0) {
            list.innerHTML = '<li class="empty-leaderboard">暂无记录，快来挑战吧！</li>';
            return;
        }
        
        list.innerHTML = leaderboard.map((entry, i) => `
            <li class="leaderboard-item ${entry.name === State.currentPlayer ? 'current-user' : ''}">
                <span class="rank ${i < 3 ? 'top3' : ''}">${i + 1}</span>
                <span class="player-name">${entry.name}</span>
                <span class="player-time">${this.formatTime(entry.time)}</span>
            </li>
        `).join('');
    },

    // 显示胜利弹窗
    showVictory() {
        const time = State.victoryTime;
        const rank = Storage.getRank(State.currentDifficulty, time);
        
        document.getElementById('victoryTime').textContent = this.formatTime(time);
        const msg = rank > 0 
            ? `太棒了！你在${Config.getDifficulty(State.currentDifficulty).label}难度排名第${rank}位！`
            : '恭喜你完成了数独！';
        document.getElementById('victoryMessage').textContent = msg;
        
        document.getElementById('victoryModal').classList.add('active');
        this.createConfetti();
    },

    // 隐藏胜利弹窗
    hideVictory() {
        document.getElementById('victoryModal').classList.remove('active');
    },

    // 显示排行榜
    async showLeaderboard() {
        await this.renderLeaderboard(State.currentDifficulty);
        document.getElementById('leaderboardModal').classList.add('active');
    },

    // 隐藏排行榜
    hideLeaderboard() {
        document.getElementById('leaderboardModal').classList.remove('active');
    },

    // 显示主题选择
    showThemeModal() {
        document.getElementById('themeModal').classList.add('active');
    },

    // 隐藏主题选择
    hideThemeModal() {
        document.getElementById('themeModal').classList.remove('active');
    },

    // 切换难度按钮状态
    updateDifficultyButtons() {
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.diff === State.currentDifficulty);
        });
    },

    // 创建纸屑动画
    createConfetti() {
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.background = ['#ff0', '#f0f', '#0ff', '#0f0', '#ff6b6b', '#ffd700'][Math.floor(Math.random() * 6)];
            confetti.style.animation = `confetti-fall ${2 + Math.random() * 2}s linear forwards`;
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }
    },

    // 格式化时间
    formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    },

    // 绑定事件
    bindEvents() {
        // 键盘支持
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('gameScreen').style.display === 'none') return;
            
            if (e.key >= '1' && e.key <= '9') {
                Game.inputNumber(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
                Game.clearCell();
            } else if (State.getSelectedCell()) {
                let { r, c } = State.getSelectedCell();
                if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
                if (e.key === 'ArrowDown') r = Math.min(8, r + 1);
                if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
                if (e.key === 'ArrowRight') c = Math.min(8, c + 1);
                Game.selectCell(r, c);
            }
        });
    }
};

// ========================================
// 游戏主控模块 Game
// ========================================
const Game = {
    // 初始化
    init() {
        UI.init();
    },

    // 开始游戏（从登录界面进入）
    async start() {
        const name = document.getElementById('playerName').value.trim();
        if (!name) {
            alert('请输入你的名字！');
            return;
        }
        
        State.setPlayer(name);
        document.getElementById('displayName').textContent = name;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        
        // 尝试加载存档
        const savedGame = await Database.loadGame(name);
        if (savedGame) {
            const resume = confirm(`找到未完成的游戏（${Config.getDifficulty(savedGame.difficulty).label}难度，已玩${this.formatTime(savedGame.timer)}），是否继续？`);
            if (resume) {
                await this.loadSavedGame(savedGame);
            } else {
                await Database.deleteGame(name);
                this.newGame();
            }
        } else {
            this.newGame();
        }
    },

    // 加载存档
    async loadSavedGame(savedGame) {
        State.resetGame();
        
        State.currentDifficulty = savedGame.difficulty;
        State.board = savedGame.board;
        State.solution = savedGame.solution;
        State.fixedCells = savedGame.fixedCells;
        State.timer = savedGame.timer;
        
        // 渲染
        UI.renderBoard();
        await UI.updatePersonalBests();
        UI.updateDifficultyButtons();
        
        // 恢复计时
        State.startTimer();
        this.timerInterval = setInterval(() => UI.updateTimer(), 1000);
        
        // 定期保存
        this.autoSaveInterval = setInterval(() => this.autoSave(), 30000); // 30秒自动保存
    },

    // 自动保存
    async autoSave() {
        if (!State.currentPlayer || State.isComplete()) return;
        
        const gameData = {
            difficulty: State.currentDifficulty,
            board: State.board,
            solution: State.solution,
            fixedCells: State.fixedCells,
            timer: State.timer
        };
        
        await Database.saveGame(State.currentPlayer, gameData);
        console.log('Game auto-saved');
    },

    // 退出游戏
    logout() {
        State.resetGame();
        document.getElementById('playerName').value = '';
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('gameScreen').style.display = 'none';
    },

    // 新游戏
    newGame() {
        State.resetGame();
        
        // 生成数独
        State.solution = Sudoku.generate();
        const { puzzle, fixed } = Sudoku.createPuzzle(
            State.solution, 
            Config.getDifficulty(State.currentDifficulty).emptyCells
        );
        State.board = puzzle;
        State.fixedCells = fixed;
        
        // 渲染
        UI.renderBoard();
        UI.updatePersonalBests();
        UI.updateDifficultyButtons();
        
        // 开始计时
        State.startTimer();
        this.timerInterval = setInterval(() => UI.updateTimer(), 1000);
    },

    // 选择格子
    selectCell(r, c) {
        State.selectCell(r, c);
        UI.updateSelection(r, c);
        UI.updateConflicts();
    },

    // 输入数字
    inputNumber(num) {
        const cell = State.getSelectedCell();
        if (!cell) return;
        
        const { r, c } = cell;
        if (State.isFixed(r, c)) return;
        
        State.setCellValue(r, c, num);
        UI.renderBoard();
        this.selectCell(r, c);
        
        // 检查是否完成
        if (State.isComplete()) {
            this.onVictory();
        }
    },

    // 清除格子
    clearCell() {
        const cell = State.getSelectedCell();
        if (!cell) return;
        
        const { r, c } = cell;
        if (State.isFixed(r, c)) return;
        
        State.setCellValue(r, c, 0);
        UI.renderBoard();
        this.selectCell(r, c);
    },

    // 使用提示
    useHint() {
        const cell = State.getSelectedCell();
        if (!cell) return;
        
        const { r, c } = cell;
        if (State.isFixed(r, c)) return;
        
        const hint = Sudoku.getHint(State.board, State.solution);
        if (hint && hint.r === r && hint.c === c) {
            State.setCellValue(r, c, hint.value);
            State.setFixed(r, c, true); // 提示填入的变为固定
            UI.renderBoard();
            this.selectCell(r, c);
            
            if (State.isComplete()) {
                this.onVictory();
            }
        }
    },

    // 检查答案
    checkSolution() {
        let errors = 0;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (State.board[r][c] !== 0 && State.board[r][c] !== State.solution[r][c]) {
                    errors++;
                }
            }
        }
        alert(errors === 0 ? '目前没有错误！' : `发现有 ${errors} 个错误，继续加油！`);
    },

    // 设置难度
    setDifficulty(diff) {
        if (State.setDifficulty(diff)) {
            this.newGame();
        }
    },

    // 选择主题
    selectTheme(theme) {
        if (State.setTheme(theme)) {
            UI.applyTheme(theme);
            document.querySelectorAll('#loginScreen .theme-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === theme);
            });
        }
    },

    // 应用主题（从弹窗）
    async applyTheme(theme) {
        State.setTheme(theme);
        UI.applyTheme(theme);
        await Database.saveTheme(theme);
        UI.hideThemeModal();
    },

    // 胜利处理
    onVictory() {
        State.stopTimer();
        clearInterval(this.timerInterval);
        State.victoryTime = State.timer;
        UI.showVictory();
    },

    // 记录成绩
    async recordScore() {
        await Database.addScore(State.currentDifficulty, State.currentPlayer, State.victoryTime);
        await Database.updatePersonalBest(State.currentDifficulty, State.victoryTime);
        await Database.deleteGame(State.currentPlayer); // 完成后删除存档
        UI.hideVictory();
        await UI.showLeaderboard();
        await UI.updatePersonalBests();
    },

    // 显示排行榜
    showLeaderboard() {
        UI.showLeaderboard();
    },

    // 关闭排行榜
    closeLeaderboard() {
        UI.hideLeaderboard();
    },

    // 切换排行榜标签
    async switchTab(diff) {
        State.currentDifficulty = diff;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === diff);
        });
        await UI.renderLeaderboard(diff);
    },

    // 关闭胜利弹窗
    closeVictory() {
        UI.hideVictory();
    },

    // 显示主题选择
    changeTheme() {
        UI.showThemeModal();
    },

    // 关闭主题选择
    closeThemeModal() {
        UI.hideThemeModal();
    }
};

// ========================================
// 全局函数（供 HTML 调用）
// ========================================
async function startGame() { await Game.start(); }
function logout() { Game.logout(); }
function newGame() { Game.newGame(); }
function setDifficulty(diff) { Game.setDifficulty(diff); }
function selectTheme(theme) { Game.selectTheme(theme); }
async function applyTheme(theme) { await Game.applyTheme(theme); }
function selectCell(r, c) { Game.selectCell(r, c); }
function inputNumber(num) { Game.inputNumber(num); }
function clearCell() { Game.clearCell(); }
function useHint() { Game.useHint(); }
function checkSolution() { Game.checkSolution(); }
async function showLeaderboard() { await Game.showLeaderboard(); }
function closeLeaderboard() { Game.closeLeaderboard(); }
async function switchTab(diff) { await Game.switchTab(diff); }
async function recordScore() { await Game.recordScore(); }
function closeVictory() { Game.closeVictory(); }
function changeTheme() { Game.changeTheme(); }
function closeThemeModal() { Game.closeThemeModal(); }

// 显示 Toast 提示（供安卓原生调用）
function showToast(message) {
    // 创建临时提示元素
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 14px;
        z-index: 9999;
        animation: fadeInOut 2s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 2000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
`;
document.head.appendChild(style);

// ========================================
// 初始化
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    await Game.init();
});

// 导出模块（用于测试或模块化加载）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Config, State, Sudoku, Storage, UI, Game };
}