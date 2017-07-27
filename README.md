# screeps_room_layout_generator
Reward based generative search through a screeps room layout possibility space

# usage

once:
npm install -g lodash

per room:
get a terrain dump by running this in screeps
    getTerrainDump : function (roomName)
    {
        //TODO - get sources as well
        var result = [];
        for(var x = 0; x < 50; ++x) for(var y = 0; y < 50; ++y)
        {
            var terrain = Game.map.getTerrainAt(x,y,roomName);
            if(terrain != 'plain')
            {
                result[x+y*50] = '"'+terrain+'"';
            }
        }
        
        var roomObject = Game.rooms[roomName];
        var controllerPos = roomObject.controller.pos;
        result[controllerPos.x+controllerPos.y*50] = '"' + STRUCTURE_CONTROLLER + '"';
        
        var mineralPos = roomObject.find(FIND_MINERALS)[0].pos;
        result[mineralPos.x+mineralPos.y*50] = '"' + STRUCTURE_EXTRACTOR + '"';
        
        return result;
    }

copy the result into initTerrain in main.js
node main.js
to see in progress or final results, copy the json block to the import field in http://screeps.dissi.me/buildingplanner/ and hit import
script will terminate when it is unable to improve its design in a reasonale time (after SINCEGENERATION reaches a configured threshold, default=100)