exports.up = function(knex) {
  return knex.schema
    .createTable("users", tbl => {
      tbl.increments();
      tbl.string("email").notNullable().unique();})

    .createTable("emails", tbl => {
      tbl.increments();
      tbl.string("message_id");
      tbl.string("from");
      tbl.string("name");
      tbl.string("to");
      tbl.string("subject");
      tbl.text("email_body");
      tbl.text("email_body_text");
      tbl.boolean("read").defaultTo(false);
      tbl.string("date");
      tbl.integer("uid");
      tbl.string("labels");
      tbl.string("gMsgId");
      tbl.string("gmThreadID");
      tbl.integer("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("RESTRICT").onUpdate("CASCADE");
    })
    .createTable("tags", tbl => {
      tbl.increments();
      tbl.string("tag");
      tbl.integer("email_id").unsigned().notNullable().references("id").inTable("emails").onDelete("RESTRICT").onUpdate("CASCADE");
    });
};
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists("tags")
    .dropTableIfExists("emails")
    .dropTableIfExists("users");
};
