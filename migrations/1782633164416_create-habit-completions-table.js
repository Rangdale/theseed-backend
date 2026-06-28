exports.up = (pgm) => {
  pgm.createTable('habit_completions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    habit_id: {
      type: 'uuid',
      notNull: true,
      references: '"habits"',
      onDelete: 'CASCADE'
    },
    user_id: {
      type: 'varchar(128)',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE'
      // Denormalized here intentionally — lets us query all
      // completions for a user without joining through habits
    },
    completed_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    completion_date: {
      type: 'date',
      notNull: true
      // Stored separately from completed_at for efficient
      // date-range queries — avoids DATE() casting on every query
    },
    notes: {
      type: 'text',
      notNull: false
    }
  });

  // THE most important index — streak calculations and
  // consistency queries filter by habit + date range constantly
  pgm.createIndex('habit_completions', ['habit_id', 'completion_date']);

  // For user-level analytics — all completions for a user by date
  pgm.createIndex('habit_completions', ['user_id', 'completion_date']);

  // Prevent duplicate completions for the same habit on the same day
  pgm.addConstraint(
    'habit_completions',
    'unique_habit_completion_per_day',
    'UNIQUE (habit_id, completion_date)'
  );
};

exports.down = (pgm) => {
  pgm.dropTable('habit_completions');
};