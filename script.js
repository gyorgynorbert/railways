/*
* Guide to the comments: 
* Every comment block describes the purpose of the code below it.
* Inline comments are used to describe small variables with seemingly unclear names or functions.
*/

/*
* Global variables
*/
const gameDisplay = document.querySelector('#game-wrapper');
const menuDisplay = document.querySelector('#menu-wrapper');
const descriptionDisplay = document.querySelector('#description-wrapper');
const easyBtn = document.querySelector('#easy');
const hardBtn = document.querySelector('#hard');
const descriptionBtn = document.querySelector('#description');
const startBtn = document.querySelector('#start');
const nameField = document.querySelector('#player-name');
const backDescriptionBtn = document.querySelector('#back-description');
const tableContainer = document.querySelector('#game-table-container');
const playerDisplay = document.querySelector('#game-level-name');
const timeDisplay = document.querySelector('#game-level-time');
const buttons = document.querySelectorAll('.btn');
const toplistWrapper = document.querySelector('#toplist-wrapper');
const toplistContainer = document.querySelector("#toplist-item-container")
const exitBtn = document.querySelector("#exit-button");

let finished = false;
let timerInterval = null;

/*
 * Variables for toplist and map info
 */
let playerName = null;
let difficulty = null;
let timeToComplete = null;
let mapId = null;

/*=======================================================
 *|                                                     |*
 *|                  HELPER FUNCTIONS                   |*
 *|                                                     |*
 *=======================================================
/*
* LoadMapData function.
* This function is responsible for loading the map data from the .json file.
* It fetches the data and then filters the maps based on the difficulty.
* It then selects a random map from the filtered maps and creates a grid from it using the above defined CreateGridFromMap function.
*/
function LoadMapData(difficulty) {
    fetch('maps.json')
        .then(response => response.json())
        .then(data => {
            const filteredMaps = data.maps.find(map => map.difficulty === difficulty);

            if (!filteredMaps || filteredMaps.maps.length === 0) {
                console.error(`No maps found for difficulty: ${difficulty}`);
                return;
            }

            const randomIndex = Math.floor(Math.random() * filteredMaps.maps.length); 
            const randomMap = filteredMaps.maps[randomIndex];

            mapId = randomMap.id;

            CreateGridFromMap(randomMap);

        })
        .catch(error => console.error("Error loading JSON file" , error));
}

/*
 * SortArrayByTimeToComplete function
 * This function is responsible for sorting the entries in localStorage in ascending order, by time.
 */
function sortArrayByTimeToComplete(entries) {
    function timeToSeconds(time) {
        const tokens = time.split(":");
        let seconds = 0;
        seconds = parseInt(tokens[0]) * 60 + parseInt(tokens[1]);
        return seconds;
    }

    return entries.sort((a,b) => timeToSeconds(a.timeToComplete) - timeToSeconds(b.timeToComplete));
}

/*
* savePlayerAndMapInfo function.
* This function is responsible for saving the player's details and map information.
* It retrieves the current entries from local storage and creates a new entry for the player.
* The new entry includes the player's ID, name, chosen difficulty, time to complete the map, and the map's ID.
* It then adds this entry to the entries array, sorts the array by completion time, and saves it back to local storage.
*/
function savePlayerAndMapInfo() {
    const entries = JSON.parse(localStorage.getItem('entries')) || [];

    const newIndex = entries.length > 0 ? entries[entries.length - 1].id + 1 : 0;

    const entry = {
        id: newIndex,
        name: playerName,
        difficulty: difficulty,
        timeToComplete: timeToComplete,
        mapId: mapId
    }

    entries.push(entry);

    const sortedEntries = sortArrayByTimeToComplete(entries);

    localStorage.setItem('entries', JSON.stringify(sortedEntries));
}

function retrievePlayerAndMapInfo() {
    return JSON.parse(localStorage.getItem('entries')) || [];
}

/*
* CreateTopList function.
* This function generates a leaderboard (top list) of players based on their performance.
* It retrieves the player entries, selects the top five, and displays them in a styled grid format.
* Each player's information is displayed in individual cells with specific formatting.
*/
function createTopList() {
    const entries = retrievePlayerAndMapInfo();

    const topEntries = entries.slice(0,5);

    let gridSize = topEntries.length;

    toplistContainer.style.display = 'grid';
    toplistContainer.style.gridTemplateColumns = '1fr';
    toplistContainer.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

    toplistContainer.innerHTML = '';

    topEntries.forEach(entry => {
        let cell = document.createElement('div');
        cell.style.display = 'grid';
        cell.style.padding = '15px';
        cell.style.margin = '10px 0';
        cell.style.backgroundColor = '#ffffff';
        cell.style.borderRadius = '10px';
        cell.style.boxShadow = '0px 4px 12px rgba(0, 0, 0, 0.1)';

        // Inner HTML structure with added styles
        cell.innerHTML = `
            <div style="font-weight: bold; font-size: 18px; color: #5f5c4a; margin-bottom: 8px;">
                <strong>Név:</strong> ${entry.name}
            </div>
            <div style="font-size: 16px; color: #7f7c63; margin-bottom: 8px;">
                <strong>Idő:</strong> ${entry.timeToComplete} perc
            </div>
            <div style="font-size: 16px; color: #7f7c63; margin-bottom: 8px;">
                <strong>Pálya ID:</strong> ${entry.mapId}
            </div>
        `;

        toplistContainer.appendChild(cell);
    });
}

/*
* CreateGridFromMap function.
* This function is responsible for creating the grid of the game.
* It creates a grid based on the map data parsed from the .json file containing the possible maps.
* The grid size is determined by the difficulty of the game. (easy = 5x5, hard = 7x7)
*/
function CreateGridFromMap(mapData) {
    let gridSize = difficulty === 'easy' ? 5 : 7;

    tableContainer.style.display = 'grid';
    tableContainer.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    tableContainer.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    tableContainer.innerHTML = '';

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            let cell = document.createElement('div');
            
            const coord = `${i},${j}`;
            const terrainInfo = mapData[coord];

            cell.id = `x${i}y${j}`;
            cell.classList.add('game-cell');
            
            if (terrainInfo) {
                const [terrain, orientation] = terrainInfo.split(',');
                cell.style.backgroundImage = `url('/pics/tiles/${terrain}')`;
                cell.style.backgroundSize = 'cover';

                cell.classList.add(terrain.slice(0,-4)); // Adds terrain class to the cell and removes the '.png' from the end
                orientation === undefined ? null : cell.classList.add(orientation);

                if (orientation) {
                    cell.classList.add(orientation);
                }
            }

            tableContainer.appendChild(cell);
        }
    }
}
    

/*
* GetDiffuculty function.
* This function is responsible for getting the difficulty of the game.
* It returns the difficulty of the game based on the active button.
*/
function GetDiffuculty() {
    for (let i = 0; i < buttons.length; i++) { 
        if (buttons[i].classList.contains('active')) {
            difficulty = buttons[i].id;
        }
    }

    return difficulty;
}

function activateMenuDisplay() {
    menuDisplay.style.display = 'block';
}

function activateGameDisplay() {
    gameDisplay.style.display = 'block';
}

function activateDescriptionDisplay() {
    descriptionDisplay.style.display = 'flex';
}

function activateToplistDisplay() {
    toplistWrapper.style.display = 'flex';
}

function deactivateToplistDisplay() {
    toplistWrapper.style.display = 'none';
}

function deactivateMenuDisplay() {
    menuDisplay.style.display = 'none';
}

function deactivateGameDisplay() {
    gameDisplay.style.display = 'none';
}

function deactivateDescriptionDisplay() {
    descriptionDisplay.style.display = 'none';
}

/*
* GetActiveButton function.
* This function is responsible for keeping track of the active button.
* It adds the 'active' class to the button that is clicked.
*/
function GetActiveButton() {
    const difficultyWrapper = document.querySelector('#menu-difficulty-chooser');
    let prevButton = null;

    difficultyWrapper.addEventListener('click', (e) => {
        const isButton = e.target.nodeName === 'BUTTON';
        if (!isButton) {
            return;
        }

        e.target.classList.add('active');

        if(prevButton !== null) {
            prevButton.classList.remove('active');
        }

        prevButton = e.target;
    });
}

/*
* getOrientation function.
* This function is responsible for getting the orientation of a certain cell.
* It returns the orientation of the cell based on the class it has.
* The orientation can be one of the following: 'left', 'down', 'right', 'up', 'horizontal', 'none'.
* If the cell has no orientation, it returns 'none'.
*/
function getOrientation(cell) {
    const orientations = ['left', 'down', 'right', 'up', 'horizontal'];

    const cellOrientation = orientations.find(orientation => cell.classList.contains(orientation));

    return cellOrientation || 'none';
}

/*
* getCoordinates function.
* This function extracts the x and y coordinates from a cell's ID.
* The ID is expected to be in the format "x<number>y<number>", for example, "x3y5".
* If the ID format is invalid, an error message is logged, and the function returns null.
* If valid, it returns the coordinates as an array [x, y].
*/
function getCoordinates(cell) {
    let x, y = null;

    // Regular expression to match the ID format "x<number>y<number>".
    const match = cell.id.match(/x(\d+)y(\d+)/);

    if (match) {
        x = parseInt(match[1], 10);
        y = parseInt(match[2], 10);
    } else {
        console.error(`Invalid ID format: ${cell.id}`);
        return null;
    }

    return [x, y];
}

/*
* checkNeighbouringCells function.
* This function is responsible for checking the neighbouring cells of a certain cell.
* It returns an array of neighbouring cells based on the orientation of the cell.
* The orientation can be one of the following: 'horizontal', 'left', 'up', 'right', 'down', 'none'.
*/
function checkNeighbouringCells(cell, gridSize, orientation) {
    let neighbors = [];

    let coords = getCoordinates(cell);
    let x = coords[0];
    let y = coords[1];

    let coordinateDirections = [];

    switch (orientation){
        case 'horizontal':
            coordinateDirections = [[0,1], [0,-1]];
            break;
        case 'left': 
            coordinateDirections = [[0,-1], [1,0]];
            break;
        case 'up': 
            coordinateDirections = [[0,-1], [-1,0]];
            break;
        case 'right': 
            coordinateDirections = [[0,1], [-1,0]];
            break;
        case 'down': 
            coordinateDirections = [[0,1], [1,0]];
            break;
        case 'none': 
            coordinateDirections = [[1,0], [-1,0]];
            break;
        default :
            return;
    }
    

    coordinateDirections.forEach(coordinateDirection => {
        let [dx, dy] = coordinateDirection;
        let newX = x + dx;
        let newY = y + dy;

        if (newX >= 0 && newY >= 0 && newX < gridSize && newY < gridSize) {
            let neighborCell = tableContainer.querySelector(`#x${newX}y${newY}`);
            if (neighborCell) {
                neighbors.push({neighbor: neighborCell, direction: coordinateDirection});
            }
        }
    });

    return neighbors;
}

/*
* canPlace function.
* This function is responsible for checking if a certain tile can be placed on a certain cell.
*/
function canPlace(thiss, that) {
    if (that.classList.contains('oasis')) {
        return false;
    }

    if (that.classList.contains('bridge') && (thiss === 'curve_rail' || thiss === 'straight_rail' || thiss === 'mountain_rail')) {
        return false;
    }

    if (that.classList.contains('mountain') && (thiss === 'curve_rail' || thiss === 'straight_rail' || thiss === 'bridge_rail')) {
        return false;
    }

    if (that.classList.contains('curve_rail') && (thiss === 'mountain_rail' || thiss === 'bridge_rail' || thiss === 'curve_rail')) {
        return false;
    }

    if (that.classList.contains('straight_rail') && (thiss === 'mountain_rail' || thiss === 'bridge_rail' || thiss === 'straight_rail')) {
        return false;
    }

    if (that.classList.contains('bridge_rail')) {
        return false;
    }

    if (that.classList.contains('mountain_rail')) {
        return false;
    }

    if (that.classList.contains('empty') && (thiss === 'mountain_rail' || thiss === 'bridge_rail')) {
        return false;
    }

    return true;
}

/*
* validOptions function.
* This function is responsible for collecting all the valid options for a certain cell.
* It returns an array of valid options.
*/
function validOptions(cell) {
    let options = [];
    const possibleTiles = ['bridge_rail', 'curve_rail', 'mountain_rail', 'straight_rail'];

    for (let i = 0; i <possibleTiles.length; i++) {
        if (canPlace(possibleTiles[i], cell)) {
            options.push(possibleTiles[i]);
        }
    }

    return options;

}

/*
* Time function.
* This function is responsible for keeping track of the time.
* It updates the time every second.
* The time is displayed in the format of: MM:SS
*/
function StartTimer() {

    if(timerInterval !== null) {
        return;
    }

    let minute = 0; 
    let second = 0;
    let secondString = "00";
    let minuteString = "00";
    timeInterval = setInterval(() => {
        second++;
        secondString = (parseInt(second)).toString().padStart(2, '0'); // Parses the second to a string and pads it with a 0 if it's less than 10
        if (second === 60) {
            minute++;
            minuteString = (parseInt(minute)).toString().padStart(2, '0'); // Same thing as secondString but for minutes
            second = 0;
        }
        timeDisplay.innerHTML = `${minuteString}:${secondString}`;
    }, 1000); // Updates the time every second (1000ms)

    if (finished) {
        clearInterval();
    }
}
    
function StopTimer() {
    clearInterval(timeInterval);
    timeInterval = null;
}

/*=======================================================
 *|                                                     |*
 *|                     MAIN LOGIC                      |*
 *|                                                     |*
 *=======================================================
/*
* checkIfSolved function.
* This function is responsible for checking if the game is solved.
* It returns a boolean value based on the completion of the game.
* If the game is solved, it returns true, otherwise it returns false.
*/
function checkIfSolved() {
    let difficulty = GetDiffuculty();
    let gridSize = difficulty === 'easy' ? 5 : 7;
    let isComplete = true;
    let allCells = document.querySelectorAll('.game-cell');

    allCells.forEach(cell => {
        let neighbouringCells = checkNeighbouringCells(cell, gridSize, getOrientation(cell));
        let cellType = cell.classList[1];
        let connected;

        let coord = getCoordinates(cell);
        console.log(coord);
        let x = coord[0];
        let y = coord[1];
        console.log(x, y);

        console.log(cell.id);
        console.log(cellType)
        switch (cellType) { 
            case 'straight_rail':
            case 'bridge_rail':
                connected = neighbouringCells.every(({neighbor, direction}) =>{
                    if ((x === 0 && y == 0) || (x === gridSize - 1 && y === gridSize - 1) || (x === 0 && y === gridSize - 1) || (x === gridSize - 1 && y === 0)) {
                        let ans = false;
                        return ans;
                    }
                    if ((x === 0 && !cell.classList.contains('horizontal')) || (x === gridSize - 1 && !cell.classList.contains('horizontal')) || (y === 0 && cell.classList.contains('horizontal')) || (y === gridSize - 1 && cell.classList.contains('horizontal'))) {
                        let ans = false;
                        return ans;
                    }
                    if (direction[0] === 1 && direction[1] === 0) {
                        let ans = ((neighbor.classList.contains('straight_rail') && !neighbor.classList.contains('horizontal')) || neighbor.classList.contains('up') || neighbor.classList.contains('right') || neighbor.classList.contains('bridge_rail'));
                        return ans;
                    }
                    if (direction[0] === -1 && direction[1] === 0) {
                        let ans = ((neighbor.classList.contains('straight_rail') && !neighbor.classList.contains('horizontal')) || neighbor.classList.contains('down') || neighbor.classList.contains('left') || neighbor.classList.contains('bridge_rail'));
                        return ans;
                    }
                    if (direction[0] === 0 && direction[1] === -1) {
                        let ans = (neighbor.classList.contains('horizontal') || neighbor.classList.contains('right') || neighbor.classList.contains('down'));
                        return ans;
                    }
                    if(direction[0] === 0 && direction[1] === 1) {
                        let ans = (neighbor.classList.contains('horizontal') || neighbor.classList.contains('left') || neighbor.classList.contains('up'));
                        return ans;
                    }
                    
                    let ans = false;
                    return ans;
                });

                if(!connected) { isComplete = false; }
                break;
            case 'curve_rail': 
            case 'mountain_rail':
                connected = neighbouringCells.every(({neighbor, direction}) =>{              
                    if(direction[0] === 0 && direction[1] === -1) {
                        let ans = (neighbor.classList.contains('horizontal') || neighbor.classList.contains('right') || neighbor.classList.contains('down'));
                        return ans;;
                    }
                    if(direction[0] === -1 && direction[1] === 0) {
                        let ans = (neighbor.classList.contains('straight_rail') || neighbor.classList.contains('left') || neighbor.classList.contains('down') || neighbor.classList.contains('bridge_rail'));
                        return ans;
                    }
                    if (direction[0] === 0 && direction[1] === 1) {
                        let ans = (neighbor.classList.contains('horizontal') || neighbor.classList.contains('left') || neighbor.classList.contains('up'));
                        return ans;;
                    }
                    if(direction[0] === 1 && direction[1] === 0) {
                        let ans = (neighbor.classList.contains('straight_rail') || neighbor.classList.contains('up') || neighbor.classList.contains('right') || neighbor.classList.contains('bridge_rail'));
                        return ans;
                    }
                    let ans = false;
                    return ans;
                });

                if(!connected) { isComplete = false; }
                break;
            case 'empty':
            case 'mountain':
            case 'bridge':
                isComplete = false;
                break;
        }
    });

    return isComplete;  
}

/*
* placeRail function.
* This function is responsible for handling the placement and logic of it.
* It listens for a click event on the grid and then places the rail based on the valid options.
* It also handles the logic for the different types of rails.
*/
function placeRail() {
    tableContainer.addEventListener('click', (e) => { 
        if (finished) {
            return;
        }
        let cell = e.target;
        let options = validOptions(cell);

        if (options.length === 0) {
            console.log(checkIfSolved());
        }

        if (options.length === 1) {
            switch (cell.classList[1]) {
                case 'straight_rail':
                    if (cell.classList.contains('horizontal')) {
                        cell.classList.remove('straight_rail', 'horizontal');
                        cell.classList.add('curve_rail');
                        cell.classList.add('left');
                        cell.style.backgroundImage = `url('/pics/tiles/curve_rail.png')`;
                    } else {
                        cell.classList.add('horizontal');
                        cell.style.backgroundImage = `url('/pics/tiles/straight_rail.png')`;
                    }

                    break;
                case 'curve_rail':
                    switch (cell.classList[2]) {
                        case 'left':
                            cell.classList.remove('left');
                            console.log("ASD");
                            cell.classList.add('up');
                            break;
                        case 'up':
                            cell.classList.remove('up');
                            cell.classList.add('right');
                            break;
                        case 'right':
                            cell.classList.remove('right');
                            cell.classList.add('down');
                            break;
                        case 'down':
                            cell.classList.remove('down');
                            cell.classList.remove('curve_rail');
                            cell.classList.add('straight_rail');
                            cell.style.backgroundImage = `url('/pics/tiles/straight_rail.png')`;
                            break;
                    }
                    break;
                case 'mountain':
                    let direction = cell.classList[2];
                    cell.classList.remove('mountain', direction);
                    cell.classList.add('mountain_rail', direction);
                    cell.style.backgroundImage = `url('/pics/tiles/mountain_rail.png')`;
                    break;
                case 'bridge':
                    if (cell.classList.contains('horizontal')) {
                        cell.classList.remove('bridge');
                        cell.classList.remove('horizontal');
                        cell.classList.add('bridge_rail');
                        cell.classList.add('horizontal');
                        cell.style.backgroundImage = `url('/pics/tiles/bridge_rail.png')`;
                    } else {
                        cell.classList.remove('bridge');
                        cell.classList.add('bridge_rail');
                        cell.style.backgroundImage = `url('/pics/tiles/bridge_rail.png')`;  
                    }
                    break;
            }
        }

        // If the cell is of type 'empty'
        if (options.length > 1) {
            let className = cell.classList[1];
            cell.classList.remove(className);
            cell.classList.add('straight_rail');
            cell.style.backgroundImage = `url('/pics/tiles/straight_rail.png')`;
        }

        if(checkIfSolved()) {
            finished = true;
            StopTimer();
            timeToComplete = timeDisplay.innerHTML;
            savePlayerAndMapInfo();
            createTopList();
            activateToplistDisplay();
        }
    });
}

/*=============================================================
 *|                                                           |*
 *|                     DRIVER FUNCTIONS                      |*
 *|                                                           |*
 *=============================================================
 */

function Game() {
    playerName = nameField.value;
    difficulty = GetDiffuculty();

    if (playerName === '' || playerName === null || difficulty === null) {
        confirm('Please fill in all the fields');
        return;
    } 

    timeDisplay.innerHTML = '00:00';
    playerDisplay.innerHTML = playerName; 

    deactivateMenuDisplay();
    activateGameDisplay();
    
    LoadMapData(difficulty);
    StartTimer();
}

function Init() {
    deactivateToplistDisplay();
    deactivateGameDisplay();;
    deactivateDescriptionDisplay();
    
    GetActiveButton();
    
    startBtn.addEventListener('click', () => { 
        Game();
        placeRail();
    });

    descriptionBtn.addEventListener('click', () => {
        activateDescriptionDisplay();
    });

    backDescriptionBtn.addEventListener('click', () => {
        deactivateDescriptionDisplay();
    });

    exitBtn.addEventListener('click', () => {
        location.reload();
    });
   
}

Init(); // Calls the Init function on page load