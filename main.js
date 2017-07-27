"use strict";
let _ = require('lodash'); // TODO - non-global lodash dependency
let screeps = require('./screepsConstants');
let Solution = require('./solution')
class App{
constructor () {
        this.roomTerrain = [];
        this.solutions = [];
        this.controllerStructures = {};
        this.roomName = "";
        this.bestScore = -999999;
        this.generation = 0;
        this.runs = 0;
        this.runsSinceGeneration = 0;
        this.sliceCount = 1;
        this.explorationRate = 10;
        this.startTime = 0;
        this.weightedScoreFunctions = [];
    }
    run ()
    {      
        this.startTime = Date.now();
        this.initControllerStructures();
        this.initTerrain(); // TODO - fetch from server
        this.initScoreFunctions();
        this.generateRandomSolution();
        while(this.runsSinceGeneration < 100)
        {
            this.permuteSolutions();
            this.sortSolutions(); // TODO - distribute to multiple processors
            this.reduceSolutions();
            this.printSolution(this.solutions[0]);
        }
    }

    initScoreFunctions()
    {
        // TODO - accessibility of sources score
        this.weightedScoreFunctions = [
            {name : "Lab", weight : 0.5, func : (s)=>this.getLabScore(s)},
            {name : "LabFill", weight : 1.5, func : (s)=>this.getLabFillScore(s)},
            {name : "Sprawl", weight : 1.5, func : (s)=>this.getSprawlScore(s)},
            {name : "Mineral", weight : 0.5, func : (s)=>this.getMineralScore(s)},
            {name : "StorageSell", weight : 1.0, func : (s)=>this.getStorageSellScore(s)},
            {name : "StorageGCL", weight : 1.0, func : (s)=>this.getGCLStorageScore(s)},
            {name : "Accessible", weight : 0.5, func : (s)=>this.getAccesibleScore(s)},
            {name : "Extension", weight : 2.0, func : (s)=>this.getExtensionScore(s)},
            {name : "Link", weight : 0.5, func : (s)=>this.getLinkScore(s)},
            {name : "CoreCircumnavigation", weight : 1.0, func : (s)=>this.getCircumnavigationScore(s)},
            {name : "GeneralCircumnavigation", weight : 1.0, func : (s)=>this.getGeneralCircumnavigationScore(s)},
        ];
    }

    initControllerStructures()
    {
        for(let structureType in screeps.CONTROLLER_STRUCTURES)
        {
            this.controllerStructures[structureType] = screeps.CONTROLLER_STRUCTURES[structureType][8];
        }

        delete this.controllerStructures[screeps.STRUCTURE_ROAD];
        delete this.controllerStructures[screeps.STRUCTURE_RAMPART];
        delete this.controllerStructures[screeps.STRUCTURE_WALL];
        delete this.controllerStructures[screeps.STRUCTURE_EXTRACTOR];
        delete this.controllerStructures[screeps.STRUCTURE_CONTAINER];
        this.controllerStructures[screeps.STRUCTURE_LINK] = 1;
    }

    initTerrain()
    {
        this.roomName = "E14S32";
        this.roomTerrain = ["wall","wall","wall","wall","wall","wall","wall",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,"wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,"wall","wall","wall","wall","wall","wall","wall","wall",,,,"wall","wall","wall",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,"wall","wall","wall","wall","wall","wall",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,"swamp","swamp",,,,,,,,,,"wall","wall",,,,"swamp","swamp",,,,,,,,,,,,,,,,,,,,,,,,,"swamp","swamp","swamp","swamp",,,,,"swamp",,,,,,,,,,,"wall","wall",,,"swamp","swamp","swamp","swamp",,,,,,,,,,,,,,,,,,,,,,,"wall","swamp","swamp","swamp","swamp","swamp",,,,,,,,,,"swamp","swamp",,,,"wall","wall",,,"swamp","swamp","swamp",,,,,,,,,,,,"wall",,,,,,,,,,,"swamp","swamp","swamp","swamp","swamp","swamp","swamp",,,"wall",,,"wall",,,"swamp","swamp","swamp","swamp",,,"wall","wall",,,"swamp","swamp",,,,,,,,,,"swamp","swamp","wall","wall","wall",,,,,,,,,"swamp","swamp","swamp","swamp","swamp","swamp","swamp","swamp",,,"wall","wall","wall","wall","wall","swamp","swamp","swamp","swamp","swamp",,,"wall","wall",,,,,,,,"wall",,,,,,"swamp","swamp","swamp","wall","swamp",,,,,"wall","wall","wall","swamp","swamp","swamp","swamp","swamp","swamp","swamp","swamp","swamp",,,,"wall","wall","wall","wall","swamp","swamp","swamp","swamp","swamp",,,"wall","wall","wall",,,,,,"wall","wall","wall",,,,,"swamp","swamp","swamp","swamp","swamp","swamp",,"wall","wall","wall","wall","wall","swamp","swamp","swamp","swamp","swamp","swamp","swamp",,,,,,,"wall","wall",,,"swamp","swamp","swamp",,,,"wall","wall","wall",,,,,,"wall","wall","wall","wall",,,,"swamp","swamp","swamp","swamp","swamp","swamp","wall","wall","wall",,,"swamp","swamp","swamp","swamp","swamp","swamp","swamp",,,,,,"swamp","swamp","swamp",,,,,"swamp","swamp",,,,"wall","wall","wall","swamp",,,,,"wall","wall","wall","wall","wall",,,,"swamp","swamp","swamp","swamp","wall","wall",,,,,,"swamp","swamp","swamp","swamp","swamp","swamp",,,,,,"swamp","swamp","swamp",,,,,"swamp","swamp","swamp",,,"wall","wall","swamp","swamp","swamp","swamp","swamp","swamp","wall","wall",,,"wall",,,,,,,"wall","wall",,,,,,,"swamp","swamp","swamp","swamp","swamp",,,,,,,"swamp","swamp","swamp",,,,,"swamp","swamp","swamp",,,"wall","wall","swamp","swamp","swamp","swamp","swamp","swamp","wall","wall",,,,,,,,,,"wall","wall",,,,,,,,"swamp","swamp","swamp","swamp",,,,,,,"swamp","swamp","swamp","swamp",,,,,"swamp",,,,"wall",,"swamp","swamp","swamp","swamp","swamp","swamp","swamp",,,,,,,,,,,,,,,,,"wall","wall","wall",,"swamp","swamp","swamp","swamp",,,,,,,"swamp","swamp","swamp","swamp",,,,,,,,"wall",,"swamp","swamp","swamp","swamp","swamp","swamp","wall",,,,,,,,,,,,,,,,,"wall","wall","wall","wall",,"swamp","swamp","swamp",,,,,,"swamp","swamp","swamp","swamp",,,,,,,,,"wall","swamp","swamp","swamp","swamp","swamp","swamp","swamp","swamp",,,,,,,,,,,,,,,,,,"wall","wall",,,"swamp","swamp","swamp",,,,,"swamp","swamp",,,,,,,,,,,,"wall","swamp","swamp","swamp","swamp","swamp","swamp","swamp","swamp","swamp","swamp","swamp","swamp",,,,,,,"wall","wall",,,,,,,,,"swamp","swamp","swamp","swamp","swamp","swamp","swamp","swamp","swamp","swamp","wall",,,,,,,,,,,"wall","swamp","swamp","swamp",,,,"swamp","swamp","swamp","swamp","swamp","swamp","swamp",,,,,,"wall","wall",,,,,,,,"swamp","swamp","swamp","swamp","swamp","swamp","swamp","swamp","swamp","swamp","swamp","wall","wall",,,,,,,,,,"wall","swamp","swamp","swamp",,,,"swamp","swamp","swamp","swamp","wall","wall","wall","wall",,,,,"wall","wall",,,,,,,"swamp","swamp","swamp","swamp",,,"swamp","swamp","swamp","swamp","swamp","swamp","swamp",,,,,,,,,,,"wall",,"swamp",,,,,,"swamp","swamp","swamp","swamp","wall","wall","wall","wall",,,,,,,,,,,,"wall","swamp","swamp",,,,"wall","swamp","swamp","swamp","swamp","swamp",,,,,,,,"swamp","swamp",,,"wall",,,,,,,,,,,"swamp","swamp","swamp","wall","swamp",,,,,,,,,,,,"wall","wall",,,,"wall","wall","wall","wall","swamp","swamp",,,,,,,,,"swamp","swamp",,,"wall",,,,,,,"wall","wall","wall",,,"swamp","swamp","swamp",,,,,,,"swamp","swamp",,,,"swamp","swamp",,,,,"wall","wall","wall","wall",,,,,,,,,,,,,,,"wall",,,,"wall","wall","wall","wall","wall","wall","wall",,,,,,,,,,"swamp","swamp","swamp",,,"swamp","swamp","swamp",,,,"wall","wall","wall","wall",,,,,,,,,,,,,,,,"wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall",,,,,,,,"swamp","swamp","swamp",,,,"swamp","swamp","swamp",,"wall","wall","wall","wall","wall",,,,,,,,,,,,,,,,,"wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall",,,,,,"wall","wall",,"swamp",,,,,,"swamp",,"wall","wall","wall","wall","wall","swamp",,,,,,,,,,,,,,,,,"wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall",,,,,,,"wall","wall",,,,,,,,,,"wall","wall","wall","wall","swamp",,,,,,,,,,,,,,,,,,"wall","wall","wall","wall","wall","wall","wall","wall","wall",,,,"swamp","swamp",,,"wall","wall","wall","wall",,,,,,,,,"wall","wall","wall","swamp","swamp",,,,,,,,"swamp","swamp","swamp",,,,,,,,"wall",,,,,,,,,,,"swamp","swamp","swamp","swamp","swamp","wall","wall","wall","wall",,,,,,,,"wall","wall","wall",,"swamp","swamp","swamp",,,,,,"swamp","swamp","swamp","swamp","swamp",,,,,,,"wall",,,"swamp","swamp",,,,,,,,"swamp","swamp","swamp","swamp","wall","wall","wall","wall","wall","wall",,,,,,"wall","wall",,"swamp","swamp","swamp","swamp","swamp",,,,,"swamp","swamp","wall","wall","swamp",,,,,,,"wall",,,"swamp","swamp","swamp",,,,,,,,"swamp","swamp","swamp","wall","wall","wall","wall","wall","wall",,,,,,,,,"swamp","swamp","swamp","swamp","swamp","swamp","swamp",,"swamp","swamp","swamp","wall","wall","wall","wall",,,,,,"wall",,,,"swamp","swamp",,,,,,,,"swamp","swamp","swamp","wall","wall","wall",,,,,,,,"swamp",,,,,,,,"wall","wall","wall","wall","swamp","swamp","swamp","swamp","wall","wall","wall",,,,,,"wall",,,,,,,,,,"swamp","swamp","swamp",,,,"swamp","wall","swamp","swamp",,,,,,"swamp","swamp","swamp",,,,,,,"wall","wall","wall","wall","swamp","swamp","swamp","swamp",,"wall","wall",,,,,,,,,,,,,,,,"swamp","swamp","swamp",,,,"swamp","swamp","swamp","swamp","swamp","swamp",,,,"swamp","swamp","swamp",,,,,,,,"wall","wall","swamp","swamp",,,,,,,"swamp",,,,,,,,,,,,,"wall","swamp","swamp","swamp","swamp",,,,"swamp","swamp","swamp","swamp","swamp","swamp",,,,"swamp","swamp",,,,,,,,,,"swamp","swamp","swamp",,,,,,,"swamp","swamp",,,,,,,,,,,"extractor","wall","wall","swamp",,,,"swamp","swamp","swamp","swamp","swamp","swamp","swamp",,,,,,,,,,,,,,,,"swamp","swamp","swamp",,,,,,,,,,,,,,,,,,,,"wall",,,,,,"swamp","swamp","swamp","swamp","swamp","swamp","swamp",,,,"swamp",,,,,,,,,,,,"swamp","swamp","swamp",,,,,,,,,,,,,,"swamp","swamp",,,,,,,,,,,,"swamp","swamp","swamp","swamp","swamp",,,,"swamp","swamp","swamp",,,,,,,,,,"swamp","swamp","swamp","swamp",,,,,,,,"wall","wall",,,"wall",,"swamp","swamp",,,,,"swamp",,,,"wall","wall","wall",,"swamp","swamp","swamp","swamp",,,,,"swamp",,,,,,,,,,"wall","wall","wall","swamp","swamp",,,,,,,"wall","wall","wall","wall","wall","wall",,"swamp","swamp","swamp",,,"swamp","swamp","swamp",,"wall","wall","wall","wall","wall","swamp","swamp","swamp",,,,,,,,,,,,,,,,"wall","wall","wall","swamp","swamp",,,,,,"swamp","wall","wall","wall","wall","wall","wall",,,"swamp","swamp","swamp","swamp","swamp","swamp","swamp",,"wall","wall","wall","wall",,,"swamp",,,,,,,,,,,,,"wall",,,,"swamp","wall","swamp","swamp",,,,,,,"swamp","swamp","wall","wall","wall","wall",,,,,,"swamp","swamp","swamp","swamp","swamp",,,,,,,,,,,,,,,,,,,,"wall","wall","wall",,,,"swamp","swamp","swamp",,,,,,,"swamp","swamp","wall","wall","wall","wall",,,,,,"wall","wall","swamp","swamp",,,,,,,,,,,,,,,,,,,,,"wall","wall","wall",,,,"swamp","swamp","swamp","swamp",,,,,,,"wall","wall","wall","wall","wall",,,,,"wall","wall","wall","wall",,,,,"swamp",,,,,,,,,,,,,,,,"swamp",,"wall","wall","wall",,,"swamp","swamp","swamp","swamp","swamp",,,,,"controller","wall","wall","wall","wall","wall",,,,"swamp","wall","wall","wall","wall",,,,"swamp","wall","wall","swamp",,,,,,,,,,,,,"swamp","swamp","swamp","wall","wall","wall","swamp","swamp","swamp","swamp","swamp","swamp","swamp",,,,"wall","wall",,,,"wall","wall",,,,"swamp","wall","wall","wall",,,,,"swamp","swamp","swamp","swamp","swamp","swamp",,,,,,,,,,,"swamp","swamp","swamp","wall","wall","wall","swamp","swamp","swamp","swamp","swamp",,,,,,,,,,,"wall","wall","wall",,,"swamp","swamp","wall","swamp",,,,,,"swamp","swamp","swamp","swamp","swamp",,,,,,,,,,,,"swamp","swamp","wall","wall","wall","swamp","swamp","swamp",,,,,,,,,,,,,"wall","wall","wall",,,,,,,,,,,,,,"swamp","swamp","swamp",,,,,,,,,,,,,"swamp","wall","wall","wall","wall","swamp",,,,,,,,,,,,,"wall","wall","wall","wall","wall",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"wall","wall","wall","wall","wall",,,,,,,,,,,,,"wall","wall","wall","wall","wall","wall",,,,,,,,,,,,,,,"wall","wall","wall","wall","wall","wall","wall","wall",,,,,,"wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
    }

    generateRandomSolution()
    {
        let newSolution = [];
        for(let structureType in this.controllerStructures)
        {
            let structureCount = this.controllerStructures[structureType];
            for(let i = 0; i < structureCount; ++i)
            {
                let validPlacement = false;
                let position = this.generateRandomPosition(newSolution, (p,s) => this.isAvailablePosition(p,s));
                newSolution[position] = structureType;
            }
        }
        let solution = new Solution();
        solution.solution = newSolution;
        this.solutions.push(solution);
    }

    isAvailablePosition(position, solution)
    {
        let terrain = this.roomTerrain[position];
        let existingStructure = solution[position];
        let terrainAvailable = terrain == undefined || terrain == 'swamp';
        let point = this.getPointFromPosition(position);
        let pointValid = point.x >= 2 && point.x <= 47 && point.y >= 2 && point.y <= 47;

        return pointValid && terrainAvailable && !existingStructure;
    }

    isValidPosition(position, solution)
    {
        let terrain = this.roomTerrain[position];
        let terrainAvailable = terrain == undefined || terrain == 'swamp';
        let point = this.getPointFromPosition(position);
        let pointValid = point.x >= 2 && point.x <= 47 && point.y >= 2 && point.y <= 47;

        return pointValid && terrainAvailable;
    }

    getPointFromPosition(position)
    {
        return {
            x: position % 50,
            y: Math.floor(position / 50),
        }
    }

    sortSolutions()
    {
        for(let s in this.solutions)
        {
            let solution = this.solutions[s];
            if(solution.score == null)
            {
                solution.score = this.calculateScore(solution.solution);
            }
        }
        this.solutions.sort((a,b)=>b.score - a.score);
    }

    reduceSolutions()
    {
        this.solutions = this.solutions.slice(0, this.sliceCount);
    }

     permuteSolutions()
    {
        let newSolutions = []
        for(let solutionIndex in this.solutions)
        {
            for(let i = 0; i < this.explorationRate; ++i)
            {
                let solution = this.solutions[solutionIndex].solution.slice();
                for(let t = 0; t <= solutionIndex+(this.runsSinceGeneration/10); ++t)
                {
                    let structureIndexToDelete = _.sample(Object.keys(solution));
                    let newPosition = 0;
                    if(Math.random() > 0.80)
                    {
                        newPosition = this.generateRandomPosition(solution, (p,s) => this.isValidPosition(p,s));
                    }
                    else
                    {
                        newPosition = this.bumpPosition(solution, parseInt(structureIndexToDelete));
                    }
                    let otherStructure = solution[newPosition];
                    if(solution[structureIndexToDelete])
                    {
                        solution[newPosition] = solution[structureIndexToDelete];
                    }
                    else
                    {
                        delete solution[newPosition];
                    }
                    if(otherStructure)
                    {
                        solution[structureIndexToDelete] = otherStructure;
                    }
                    else
                    {
                        delete solution[structureIndexToDelete];
                    }
                }

                let pushme = new Solution();
                pushme.solution = solution;
                newSolutions.push(pushme);
            }
        }

        this.solutions = this.solutions.concat(newSolutions);
    }

     printSolution(solutionObject)
    {
        let solution = solutionObject.solution;
        let output = '{"name":"'+this.roomName+'", "rcl":"8","buildings":';
        let dissiFormat = {}
        for(let i in solution)
        {
            let structureType = solution[i];
            if(!dissiFormat[structureType])
            {
                dissiFormat[structureType] = {structureType, pos:[]};
            }

            dissiFormat[structureType].pos.push(this.getPointFromPosition(i))
        }
        output += JSON.stringify(dissiFormat);
        output += '}';
        let score = solutionObject.score;
        if(score > this.bestScore)
        {
            this.bestScore = score;
            ++this.generation;
            this.runsSinceGeneration = 0;
        }
        else
        {
            ++this.runsSinceGeneration;
        }

        let currentTime = Date.now();
        let elapsedTime = Math.round((currentTime - this.startTime)/1000);
        console.log(output + "\n"+ "SCORE:" + score + " GENERATION:" + this.generation + " RUN:" + ++this.runs + " SINCEGENERATION:"+this.runsSinceGeneration + " TIME:" + elapsedTime+"s");
    }

     generateRandomPosition(solution, func)
    {
        let position = 0;
        do
        {
            position = Math.round(Math.random() * 50 * 50);
        } while(!func(position, solution));

        return position;
    }

     bumpPosition(solution, pos)
    {
        let newPos = pos + _.sample([-1,1,-49,49,-50,50,-51,51,-2,2,-98,98,-100,100,-102,102]);
        if(this.isValidPosition(newPos, solution))
        {
            return newPos;
        }
        return pos;
    }

     calculateScore(solution)
    {
        let scores = {};
        for(let i in this.weightedScoreFunctions)
        {
            let weightedScoreFunction = this.weightedScoreFunctions[i];
            scores[weightedScoreFunction.name] = weightedScoreFunction.weight * weightedScoreFunction.func(solution);
        }
        let totalScore = 0;
        for(let i in scores)
        {
            totalScore += scores[i];
        }
        return totalScore;
    }

     getLabFillScore(solution)
    {
        let terminalPosition = solution.findIndex((s)=>s==screeps.STRUCTURE_TERMINAL);
        let storagePosition = solution.findIndex((s)=>s==screeps.STRUCTURE_STORAGE);
        let maxDistance = 0;
        for(let i in solution)
        {
            let structureType = solution[i];
            if(structureType == screeps.STRUCTURE_LAB)
            {
                let terminalDistance = this.getPathDistance(solution, terminalPosition, i);
                let storageDistance = this.getPathDistance(solution, storagePosition, i);

                if(terminalDistance == null || storageDistance == null)
                {
                    return -1000;
                }

                maxDistance = Math.max(terminalDistance, storageDistance, maxDistance);
            }
        }

        return 1/maxDistance;
    }

     getLabScore(solution)
    {
        let labs = [];
        for(let i in solution)
        {
            let structureType = solution[i];
            if(structureType == screeps.STRUCTURE_LAB)
            {
                labs.push(i);
            }
        }

        let score = 0;
        for(let l in labs)
        {
            let lab = labs[l];
            let closeLabs = 0;
            for(let j in labs)
            {
                let other = labs[j];
                if(lab == other)
                {
                    continue;
                }

                score += .02 / this.getPositionalDistance(lab, other);
            }
        }

        return score;
    }

     getPositionalDistance(a,b)
    {
        let ap = this.getPointFromPosition(a);
        let bp = this.getPointFromPosition(b);

        let dx = Math.abs(ap.x - bp.x);
        let dy = Math.abs(ap.y - bp.y);

        return Math.max(dx,dy);
    }

      getSprawlScore(solution)
    {
        let storagePosition = solution.findIndex((s)=>s==screeps.STRUCTURE_STORAGE);
        let distances = []
        for(let position in solution)
        {
            distances.push(this.getPositionalDistance(position, storagePosition));
        }
        let totalDistance = _.sum(distances);
        let averageDistance = totalDistance / distances.length;

        return 13/averageDistance;
    }

     getMineralScore(solution)
    {
        let mineralPosition = this.roomTerrain.findIndex((t)=>t==screeps.STRUCTURE_EXTRACTOR);
        let terminalPosition = solution.findIndex((s)=>s==screeps.STRUCTURE_TERMINAL);

        let distance = this.getPathDistance(solution, mineralPosition, terminalPosition);
        if(distance == null)
        {
            return -1000;
        }
        if(distance <= 1)
        {
            return 0;
        }

        return 2 / distance;
    }

     getStorageSellScore(solution)
    {
        let terminalPosition = solution.findIndex((s)=>s==screeps.STRUCTURE_TERMINAL);
        let storagePosition = solution.findIndex((s)=>s==screeps.STRUCTURE_STORAGE);

        let distance = this.getPathDistance(solution, terminalPosition, storagePosition);
        if(distance != null)
        {
            return 1 / distance;
        }

        return -1000;
    }

      getLinkScore(solution)
    {
        let linkPosition = solution.findIndex((s)=>s==screeps.STRUCTURE_LINK);
        let storagePosition = solution.findIndex((s)=>s==screeps.STRUCTURE_STORAGE);

        let distance = this.getPathDistance(solution, linkPosition, storagePosition);
        if(distance != null)
        {
            return 1 / distance;
        }

        return -1000;
    }

    getCircumnavigationScore(solution)
    {
        let navigablesCount = 0;
        let navigablesNavigable = 0;
        for(let i in solution)
        {
            let structureType = solution[i];
            if(structureType == screeps.STRUCTURE_SPAWN || structureType == screeps.STRUCTURE_TERMINAL || structureType == screeps.STRUCTURE_STORAGE)
            {
                ++navigablesCount;
                if(this.isCircumnavigable(solution, i))
                {
                    ++navigablesNavigable;
                }
            }
        }

        return navigablesNavigable/navigablesCount;
    }

    getGeneralCircumnavigationScore(solution)
    {
        let navigablesCount = 0;
        let navigablesNavigable = 0;
        for(let i in solution)
        {
            ++navigablesCount;
            if(this.isCircumnavigable(solution, i))
            {
                ++navigablesNavigable;
            }
        }

        return navigablesNavigable/navigablesCount;
    }

     getGCLStorageScore(solution)
    {
        let controllerPosition = this.roomTerrain.findIndex((t)=>t==screeps.STRUCTURE_CONTROLLER);
        let storagePosition = solution.findIndex((s)=>s==screeps.STRUCTURE_STORAGE);

        let distance = this.getPathDistance(solution, controllerPosition, storagePosition);

        if(distance == null)
        {
            return -1000;
        }

        return 1 / distance;
    }

     getAccesibleSurroundings(solution, position)
    {
        let available = 0;
        if(this.isAvailablePosition(position + 1, solution)) {++available}
        if(this.isAvailablePosition(position - 1, solution)) {++available}
        if(this.isAvailablePosition(position - 49, solution)) {++available}
        if(this.isAvailablePosition(position - 50, solution)) {++available}
        if(this.isAvailablePosition(position - 51, solution)) {++available}
        if(this.isAvailablePosition(position + 49, solution)) {++available}
        if(this.isAvailablePosition(position + 50, solution)) {++available}
        if(this.isAvailablePosition(position + 51, solution)) {++available}

        return available;
    }

     getAccesibleScore(solution)
    {
        let score = 0;
        for(let i in solution)
        {
            let structureType = solution[i];
            if(structureType != screeps.STRUCTURE_OBSERVER && this.getAccesibleSurroundings(solution, i) == 0)
            {
                score -= 1000;
            }
        }
        let mineralPosition = this.roomTerrain.findIndex((t)=>t==screeps.STRUCTURE_EXTRACTOR);
        if(this.getAccesibleSurroundings(solution, mineralPosition) == 0)
        {
            score -= 1000;
        }

        return score;
    }

     getExtensionScore(solution)
    {
        let storagePosition = solution.findIndex((s)=>s==screeps.STRUCTURE_STORAGE);
        let totalDistance = 0;
        let totalPoints = 0;
        let score = 0;
        let fillMes = [];
        for(let i in solution)
        {
            let structureType = solution[i];
            if(structureType == screeps.STRUCTURE_EXTENSION || structureType == screeps.STRUCTURE_SPAWN || structureType == screeps.STRUCTURE_TOWER || structureType == screeps.STRUCTURE_LAB || structureType == screeps.STRUCTURE_POWER_SPAWN)
            {
                fillMes.push(i);
            }
        }

        for(let i=0; i<fillMes.length-1; ++i)
        {
            let fillMe = fillMes[i];
            let distances = this.getPathDistance(solution, fillMe, fillMes.slice(i+1));
            if(distances == null)
            {
                return -1000;
            }
            totalDistance += _.sum(distances);
            totalPoints += distances.length || 1;
        }

        let averageDistance = totalDistance / totalPoints;
        score +=  1 / averageDistance;
        return score;
    }

     getPathDistance(solution, a, b)
    {
        let visited = [];
        let queue = [a];
        let depthSet = [];
        let depth = 0;
        let results = [];
        while(queue.length > 0)
        {
            depthSet = queue;
            queue = [];
            
            for(let i in depthSet)
            {
                let position = depthSet[i];
                visited.push(position);
                if(position == b)
                {
                    return depth;
                }
                else if(Array.isArray(b) && b.includes(""+position))
                {
                    results.push(depth);
                    if(results.length == b.length)
                    {
                        return results;
                    }
                    continue;
                }
                
                const offsets = [1,-1,49,50,51,-49,-50,-51];
                for(let j in offsets)
                {
                    let offset = offsets[j];
                    let newPosition = parseInt(position) + offset;
                    let isMatch = newPosition == b || (Array.isArray(b) && b.includes(""+newPosition));
                    if( isMatch || this.isAvailablePosition(newPosition, solution))
                    {
                        {queue.push(newPosition)}
                    }
                }
            }

            queue = _.uniq(queue);
            queue = _.difference(queue, visited);

            ++depth;
        }

        return null;
    }

    isCircumnavigable(solution, position)
    {
        const offsets = [-50,50,-1,1];
        for(let i in offsets)
        {
            let offset = offsets[i];
            if(!this.isAvailablePosition(parseInt(position)+offset, solution))
            {
                return false;
            }
        }
        return true;
    }
}

let app = new App();
app.run();