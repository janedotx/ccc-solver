const scheduler = require("../index.js");
var assert = require("assert");

//lists availability by worker instead of by day
function createAvailabilityByWorker(nworkers, availabilityByDay) {
    var result = [];
    var ndays = availabilityByDay.length;
    for (let iworker = 0; iworker < nworkers; iworker++) {
        result.push([]); //make new array for that worker
        for (let iday = 0; iday < ndays; iday++) {
            if (availabilityByDay[iday].includes(iworker)) {
                result[iworker].push(iday); //if assigned, push to worker's array
            }
        }
    }
    return result;
}

//lists assignments by worker instead of by day
function createAssignmentsByWorker(nworkers, assignmentsByDay) {
    var result = [];
    var ndays = assignmentsByDay.length;
    for (let iworker = 0; iworker < nworkers; iworker++) {
        result.push([]); //make new array for that worker
        for (let iday = 0; iday < ndays; iday++) {
            if (assignmentsByDay[iday] == iworker) {
                result[iworker].push(iday); //if assigned, push to worker's array
            }
        }
    }
    return result;
}

//determines if an assignment is valid by availability, returns true or false
function isValidAssignment(
    nworkers,
    availabilityByWorker,
    assignmentsByWorker
) {
    for (let iworker = 0; iworker < nworkers; iworker++) {
        for (let iassign of assignmentsByWorker[iworker]) {
            if (!availabilityByWorker[iworker].includes(iassign)) {
                throw new Error(
                    "Worker " +
                        iworker +
                        " was assigned Day " +
                        iassign +
                        " despite unavailability."
                );
                return false;
            }
        }
    }
    return true;
}

//deteremines if an assigment is "fair" by checking possible swaps which would improve fairness
function isFairAssignment(
    nworkers,
    availabilityByDay,
    assignmentsByDay,
    assignmentsByWorker
) {
    for (let iday = 0; iday < assignmentsByDay.length; iday++) {
        let assignedWorker = assignmentsByDay[iday];
        let availableWorkers = availabilityByDay[iday];
        for (let availableWorker of availableWorkers) {
            if (availableWorker != assignedWorker) {
                //can't swap with yourself
                if (
                    assignmentsByWorker[availableWorker].length <
                    assignmentsByWorker[assignedWorker].length - 1
                ) {
                    throw new Error(
                        "Day " +
                            iday +
                            " assigned to Worker " +
                            assignedWorker +
                            " even though Worker " +
                            availableWorker +
                            " had sufficiently lower total assigned workload."
                    );
                    return false;
                }
            }
        }
    }
    return true;
}

function makeRandomAvailability(nworkers, ndays, c) {
    var result = [];
    for (let iday = 0; iday < ndays; iday++) {
        result.push([]);
        for (let iworker = 0; iworker < nworkers; iworker++) {
            if (Math.random() < c) {
                result[result.length - 1].push(iworker);
            }
        }
    }
    return result;
}

function makeAvailabilityByProbabilityArray(ndays, availProbabilityArray) {
    var result = [];
    var nworkers = availProbabilityArray.length;
    for (let iday = 0; iday < ndays; iday++) {
        result.push([]);
        for (let iworker = 0; iworker < nworkers; iworker++) {
            if (Math.random() < availProbabilityArray[iworker]) {
                result[result.length - 1].push(iworker);
            }
        }
    }
    return result;
}

function makeOneWorkerOffSyncAvailability(nworkers, ndays, daysOffSync, c) {
    var result = [];
    for (let iday = 0; iday < ndays; iday++) {
        result.push([]);
    }
    var randomWorker = Math.floor(Math.random() * (nworkers - 1));
    for (let iday = 0; iday < daysOffSync; iday++) {
        result[iday].push(randomWorker);
    }
    for (let iday = daysOffSync; iday < ndays; iday++) {
        for (let iworker = 0; iworker < nworkers; iworker++) {
            if (iworker != randomWorker) {
                if (Math.random() < c) {
                    result[iday].push(iworker);
                }
            }
        }
    }
    return result;
}

function testAssignment(
    description,
    nworkers,
    availabilityByDay,
    assignmentsByDay
) {
    assignment = scheduler.computeSchedule(nworkers, availabilityByDay);
    assignmentsByDay = assignment[0];
    let availabilityByWorker = createAvailabilityByWorker(
        nworkers,
        availabilityByDay
    );
    let assignmentsByWorker = createAssignmentsByWorker(
        nworkers,
        assignmentsByDay
    );

    testAssignmentLength(description, availabilityByDay, assignmentsByDay);
    testAssignmentValidity(
        description,
        nworkers,
        availabilityByWorker,
        assignmentsByWorker
    );
    testAssignmentFairnessUsingSwaps(
        description,
        nworkers,
        availabilityByDay,
        assignmentsByDay,
        assignmentsByWorker
    );
}

describe("scheduler.computeSchedule()", function() {
    var tests = [
        {
            name: "Test Case: 01 Person, 01 Days, All Available",
            input: {
                nworkers: 1,
                availabilityByDay: [[0]]
            }
        },
        {
            name: "Test Case: 10 People, 09 Days, No Availability",
            input: {
                nworkers: 10,
                availabilityByDay: [[], [], [], [], [], [], [], [], []]
            }
        },
        {
            name: "Test Case: 05 People, 20 Days, All Available",
            input: {
                nworkers: 5,
                availabilityByDay: [
                    [3, 0, 2, 1, 4],
                    [3, 4, 2, 0, 1],
                    [1, 2, 0, 3, 4],
                    [2, 0, 4, 3, 1],
                    [3, 4, 2, 0, 1],
                    [1, 2, 3, 0, 4],
                    [2, 0, 4, 1, 3],
                    [2, 0, 3, 1, 4],
                    [2, 1, 4, 3, 0],
                    [0, 3, 4, 2, 1],
                    [0, 3, 1, 4, 2],
                    [1, 3, 2, 0, 4],
                    [2, 4, 3, 1, 0],
                    [1, 4, 3, 0, 2],
                    [4, 0, 2, 1, 3],
                    [4, 0, 2, 3, 1],
                    [3, 1, 2, 4, 0],
                    [4, 1, 3, 2, 0],
                    [0, 4, 2, 1, 3],
                    [1, 2, 0, 3, 4]
                ]
            },
            given: [0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2]
        },
        {
            name: "Test Case: 05 People, 20 Days, .7 Availability",
            input: {
                nworkers: 5,
                availabilityByDay: makeRandomAvailability(5, 20, 0.7)
            }
        },
        {
            name: "Test Case: 03 People, 31 Days, .2 Availability",
            input: {
                nworkers: 3,
                availabilityByDay: makeRandomAvailability(3, 31, 0.2)
            }
        },
        {
            name: "Test Case: 06 People, 27 Days, One Person Very Available",
            input: {
                nworkers: 6,
                availabilityByDay: makeAvailabilityByProbabilityArray(27, [
                    0.3,
                    0.3,
                    0.9,
                    0.3,
                    0.3,
                    0.3
                ])
            }
        },
        {
            name: "Test Case: 04 People, 34 Days, One Person Very Unavailable",
            input: {
                nworkers: 4,
                availabilityByDay: makeAvailabilityByProbabilityArray(34, [
                    0.4,
                    0.4,
                    0.05,
                    0.4
                ])
            }
        },
        {
            name: "Test Case: 07 People, 50 Days, One Person Off Sync",
            input: {
                nworkers: 7,
                availabilityByDay: makeOneWorkerOffSyncAvailability(
                    7,
                    50,
                    17,
                    0.3
                )
            }
        }
    ];

    const USE_GIVEN = false;
    tests.forEach(function(test) {
        //console.log(test.name);
        //console.log(test.input.availabilityByDay);
        var assignment = scheduler.computeSchedule(
            test.input.nworkers,
            test.input.availabilityByDay
        );
        //assignemnt is an array, the first part of which is an assignment,
        // the second part of which is an "unfairness" score
        var assignmentsByDay = assignment[0];

        /* if you want to test the tests, you can add a 'given' assignment
         to the test and see what it thinks */
        if (USE_GIVEN && test.hasOwnProperty("given")) {
            assignmentsByDay = test.given;
        }

        var assignmentsByWorker = createAssignmentsByWorker(
            test.input.nworkers,
            assignmentsByDay
        );
        //console.log("assignments by worker:")
        //console.log(assignmentsByWorker);

        var availabilityByWorker = createAvailabilityByWorker(
            test.input.nworkers,
            test.input.availabilityByDay
        );

        it(test.name + " has correct length", function() {
            assert.equal(
                assignmentsByDay.length,
                test.input.availabilityByDay.length
            );
        });

        it(test.name + " has valid assignemnt", function() {
            assert(
                isValidAssignment(
                    test.input.nworkers,
                    availabilityByWorker,
                    assignmentsByWorker
                )
            );
        });

        it(test.name + " has fair assignemnt", function() {
            assert(
                isFairAssignment(
                    test.input.nworkers,
                    test.input.availabilityByDay,
                    assignmentsByDay,
                    assignmentsByWorker
                )
            );
        });
    });
});
