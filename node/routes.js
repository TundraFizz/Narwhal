var app         = require("../server.js");
var csvParse    = require("csv-parse/lib/sync");
var {spawnSync} = require("child_process");
var fs          = require("fs");

function ParseLine(input){
  var yolo = csvParse(input, {"delimiter": " "})[0];
  // console.log(yolo);
  for(var i = 0; i < yolo.length; i++){
    if(yolo[i] == ""){
      console.log("Removing at index:", i);
      yolo.splice(i, 1);
      i--;
    }
  }
  // console.log(yolo);
  return yolo;
}

app.get("/", function(req, res){

  /*
    docker stack ls
    --> NAME                SERVICES            ORCHESTRATOR
    --> dolphin             3                   Swarm

    docker stack services dolphin -q
    --> fq69liqjvox2
    --> nqd1msi2waot
    --> r62o5nui39n7

    docker service inspect fq69liqjvox2
    --> JSON Object

    docker container ls -q
    --> b09a96f62e49
    --> 464972fca543
    --> ce3814b00716

    docker container inspect b09a96f62e49
    --> JSON Object

    docker image ls -q
    --> 7a5c0cd2fc2b
    --> 29e0ae3b69b9
    --> c82521676580
    --> 93d0d7db5ce2

    docker image inspect 7a5c0cd2fc2b
    --> JSON Object
  */

  var stacks     = [];
  var services   = [];
  var containers = [];
  var volumes    = [];

  stacks = [["dolphin"]];

  //------------------------------------------------------------------

  spawn = spawnSync("docker", ["stack", "services", "dolphin", "-q"]);
  var out = spawn.stdout.toString("utf-8").trim().replace(/ +/g, " ").split("\n");
  services = out;

  spawn = spawnSync("docker", ["service", "inspect", services[0]]);
  var out = spawn.stdout.toString("utf-8");
  services = JSON.parse(out);

  //------------------------------------------------------------------

  spawn = spawnSync("docker", ["container", "ls", "-q"]);
  out = spawn.stdout.toString("utf-8").trim().replace(/ +/g, " ").split("\n");

  var args = ["container", "inspect"];
  for(var i = 0; i < out.length; i++)
    args.push(out[i]);

  spawn = spawnSync("docker", args);
  out = spawn.stdout.toString("utf-8");
  data = JSON.parse(out);

  // Now do stuff with the data
  for(var i = 0; i < data.length; i++){
    var obj  = data[i];

    var id      = obj["Id"].substring(0, 12);
    var status  = obj["State"]["Status"];
    var stack   = obj["Config"]["Labels"]["com.docker.stack.namespace"];
    var service = obj["Config"]["Labels"]["com.docker.swarm.service.name"];
    var image   = obj["Config"]["Image"].split(":")[0];

    var temp = {
      "id"     : id,
      "status" : status,
      "stack"  : stack,
      "service": service,
      "image"  : image
    };

    containers.push(temp);
  }

  //------------------------------------------------------------------

  // Remove all duplicate spaces, because otherwise the .split function below won't work
  // Matches a "space" character (match 1 or more of the preceding token)
  // var out = spawn.stdout.toString("utf-8").trim().replace(/ +/g, " ").split("\n");

  // for(var i = 0; i < out.length; i++){
  //   var temp = out[i].split(" ");
  //   stacks.push(temp);
  // }

  // spawn = spawnSync("docker", ["service" , "ls"]);
  // out = spawn.stdout.toString("utf-8").trim().replace(/ +/g, " ").split("\n");
  // for(var i = 0; i < out.length; i++)
  //   services.push(out[i].split(" "));

  // spawn = spawnSync("docker", ["container", "ls"]);
  // out = spawn.stdout.toString("utf-8").trim().split("\n");
  // for(var i = 0; i < out.length; i++){
  //   var temp = ParseLine(out[i]);
  //   containers.push(temp);
  // }

  // spawn = spawnSync("docker", ["volume" , "ls"]);
  // out = spawn.stdout.toString("utf-8").trim().replace(/ +/g, " ").split("\n");
  // for(var i = 0; i < out.length; i++)
  //   volumes.push(out[i].split(" "));

  res.render("index.ejs", {
    "stacks"    : stacks,
    "services"  : services,
    "containers": containers,
    "volumes"   : volumes
  });
});
