exports.up = (pgm) => {
  pgm.createTable('discipline_scores', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    user_id: {
      type: 'varchar(128)',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE'
    },
    score: {
      type: 'numeric(5,2)',
      notNull: true
      // e.g. 84.50 — 5 digits total, 2 decimal places
    },
    consistency_score: {
      type: 'numeric(5,2)',
      notNull: true
    },
    streak_stability: {
      type: 'numeric(5,2)',
      notNull: true
    },
    completion_rate: {
      type: 'numeric(5,2)',
      notNull: true
    },
    score_date: {
      type: 'date',
      notNull: true
      // One row per user per day
    },
    calculated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // For fetching score history for a user
  pgm.createIndex('discipline_scores', ['user_id', 'score_date']);

  // One score per user per day
  pgm.addConstraint(
    'discipline_scores',
    'unique_score_per_user_per_day',
    'UNIQUE (user_id, score_date)'
  );
};

exports.down = (pgm) => {
  pgm.dropTable('discipline_scores');
};