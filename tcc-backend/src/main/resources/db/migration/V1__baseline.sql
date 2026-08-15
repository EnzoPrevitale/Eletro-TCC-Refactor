CREATE TYPE cycleStatus AS ENUM (
    'CHARGE',
    'DISCHARGE'
    );

CREATE TYPE componentType AS ENUM (
    'CAPACITOR',
    'RESISTOR'
    );

CREATE TYPE trialMode AS ENUM (
    'CYCLE',
    'TIME'
    );

CREATE TYPE trialStatus AS ENUM (
    'IDLE',
    'NEW_TEST'
    );

CREATE TABLE IF NOT EXISTS "trial" (
    "id" UUID NOT NULL,
    "mode" TRIALMODE NOT NULL,
    "cycles" INTEGER,
    "time" TIME,
    "time_started" TIMESTAMP NOT NULL,
    "end_time" TIMESTAMP,
    "status" TRIALSTATUS NOT NULL DEFAULT 'NEW_TEST',
    "active" BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cycle" (
    "id" UUID NOT NULL,
    "number" INTEGER,
    "trial_id" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "measurement" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "cycle_status" CYCLESTATUS,
    "time" TIME,
    "voltage" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY ("id")
);

ALTER TABLE "cycle"
    ADD FOREIGN KEY ("trial_id")
        REFERENCES "trial" ("id")
        ON UPDATE NO ACTION
        ON DELETE NO ACTION;

ALTER TABLE "measurement"
    ADD FOREIGN KEY ("cycle_id")
        REFERENCES "cycle" ("id")
        ON UPDATE NO ACTION
        ON DELETE NO ACTION;