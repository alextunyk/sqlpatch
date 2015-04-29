-- generated by {{&pkg.name}} {{&pkg.version}}

CREATE TABLE IF NOT EXISTS ___patches(
    name VARCHAR(100) PRIMARY KEY,
    created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);



{{#patches}}

-- {{&name}} - {{&file}}

DO $___patch_{{&number}}$
BEGIN

    IF EXISTS (SELECT 1 FROM ___patches WHERE name = '{{&name}}') THEN
        RETURN;
    END IF;

    {{#properties.require}}
    IF NOT EXISTS (SELECT 1 FROM ___patches WHERE name = '{{&.}}')
        THEN RAISE EXCEPTION 'missing dependency: {{&.}}';
    END IF;
    {{/properties.require}}

{{&content}}

    INSERT INTO ___patches (name) VALUES('{{&name}}');

END
$___patch_{{&number}}$ LANGUAGE plpgsql;

{{/patches}}