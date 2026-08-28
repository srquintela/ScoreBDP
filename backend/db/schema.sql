-- Create sequence for scores id
CREATE SEQUENCE scores_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE weights (
  user_id VARCHAR2(100) PRIMARY KEY,
  potencial NUMBER,
  vocacion NUMBER,
  complejidad NUMBER,
  riesgo_climatico NUMBER,
  perfil_financiero NUMBER
);

CREATE TABLE scores (
  id NUMBER PRIMARY KEY,
  user_id VARCHAR2(100),
  created_at TIMESTAMP,
  raw_score NUMBER,
  final_score NUMBER,
  contributions CLOB
);
