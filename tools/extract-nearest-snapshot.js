var mongoose = require("mongoose")
  , df = require("dateformat")
  , config = require("../config.js")

require("../models")
var BoardSnapshot = mongoose.model('BoardSnapshot')

function sumOfPoints(err, board) {
  var sop

  if (err) throw new Error(err)

  console.info(board.name +": " + df(board.shotTime, "isoDateTime"))
  sop = board.sopGroupByModule({
      done: {
          match: true
        , regexp: /done/i
      }
    , qa: {
          match: true
        , regexp: /qa/i
      }
    , unfinished: {
          match: false
        , regexp: /done|qa/i
      }
    , total: {
          match: true
        , regexp: /.*/i
      }
    })
  console.info(sop)
  mongoose.connection.close()
  console.info("Mongodb connection closed.")
}

mongoose.connect(config.mongodb.path)
console.info("Mongodb connected.")
BoardSnapshot.findOne().sort("shotTime", -1).exec(sumOfPoints)
