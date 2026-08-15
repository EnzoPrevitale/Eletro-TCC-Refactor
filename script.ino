#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// =====================================================
// LCD
// =====================================================

LiquidCrystal_I2C lcd(0x27, 16, 2);

// =====================================================
// PINOS
// =====================================================

#define PINO_CARGA 8
#define PINO_LEITURA A0

// =====================================================
// COMPONENTES
// =====================================================

const float CAPACITOR_uF = 470.0;
const float RESISTOR_OHM = 2200.0;

// =====================================================
// CONSTANTE DE TEMPO
// =====================================================

const float TAU =
  (RESISTOR_OHM * CAPACITOR_uF) / 1000000.0;

// =====================================================
// ADC
// =====================================================

const float VCC = 5.0;
const int ADC_MAX = 1023;

// =====================================================
// LIMITES
// =====================================================

const float TENSAO_MAX = 4.99;
const float TENSAO_MIN = 0.005;

// =====================================================
// PRÉ-CONDICIONAMENTO
// =====================================================

// Quantidade de ciclos ignorados
const int CICLOS_PRE_CONDICIONAMENTO = 10;

// =====================================================
// ESTADO DO ENSAIO
// =====================================================

bool testeAtivo = false;
bool carregando = false;

unsigned long tempoCicloInicio = 0;

// Ciclos de pré-condicionamento
int cicloPre = 1;

// Ciclos efetivos
int cicloEfetivo = 1;

// =====================================================
// FUNÇÕES
// =====================================================

void mostrarAguardando()
{
  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Circuito RC");

  lcd.setCursor(0, 1);
  lcd.print("Aguardando...");
}

// =====================================================
// RESET
// =====================================================

void resetarTeste()
{
  testeAtivo = false;

  carregando = false;

  digitalWrite(PINO_CARGA, LOW);

  cicloPre = 1;
  cicloEfetivo = 1;

  tempoCicloInicio = 0;

  mostrarAguardando();

  Serial.println("RESET_OK");
}

// =====================================================
// INICIAR
// =====================================================

void iniciarTeste()
{
  if (testeAtivo)
    return;

  testeAtivo = true;

  carregando = true;

  cicloPre = 1;
  cicloEfetivo = 1;

  tempoCicloInicio = millis();

  digitalWrite(PINO_CARGA, HIGH);

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("PRE-CONDICION.");

  lcd.setCursor(0, 1);
  lcd.print("Ciclo: 1/10");

  Serial.println("PRE_CONDICIONAMENTO");

  Serial.println("Ciclo,Estado,Tempo_ms,Tensao_V");
}

// =====================================================
// PARAR
// =====================================================

void pararTeste()
{
  testeAtivo = false;

  carregando = false;

  digitalWrite(PINO_CARGA, LOW);

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("TESTE PARADO");

  lcd.setCursor(0, 1);
  lcd.print("Aguardando...");

  Serial.println("STOP_OK");
}

// =====================================================
// COMANDOS SERIAL
// =====================================================

void verificarComandoSerial()
{
  if (Serial.available() == 0)
    return;

  String comando = Serial.readStringUntil('\n');

  comando.trim();
  comando.toUpperCase();

  // -------------------------------
  // RESET
  // -------------------------------

  if (comando == "RESET" ||
      comando == "NOVO_TESTE")
  {
    resetarTeste();

    delay(300);

    iniciarTeste();
  }

  // -------------------------------
  // STOP
  // -------------------------------

  else if (comando == "STOP")
  {
    pararTeste();
  }

  // -------------------------------
  // START MANUAL OPCIONAL
  // -------------------------------

  else if (comando == "START")
  {
    iniciarTeste();
  }
}

// =====================================================
// SETUP
// =====================================================

void setup()
{
  Serial.begin(115200);

  pinMode(PINO_CARGA, OUTPUT);

  digitalWrite(PINO_CARGA, LOW);

  lcd.init();
  lcd.backlight();

  mostrarAguardando();

  delay(1000);

  Serial.println("================================");
  Serial.println("      EXPERIMENTO CIRCUITO RC");
  Serial.println("================================");

  Serial.print("Capacitor: ");
  Serial.print(CAPACITOR_uF);
  Serial.println(" uF");

  Serial.print("Resistor: ");
  Serial.print(RESISTOR_OHM);
  Serial.println(" ohms");

  Serial.print("Tau teorico: ");
  Serial.print(TAU, 3);
  Serial.println(" s");

  Serial.print("Pre-condicionamento: ");
  Serial.print(CICLOS_PRE_CONDICIONAMENTO);
  Serial.println(" ciclos");

  Serial.println("ARDUINO_RC_PRONTO");

  // =================================================
  // INICIA AUTOMATICAMENTE
  // =================================================

  delay(1000);

  iniciarTeste();
}

// =====================================================
// LOOP
// =====================================================

void loop()
{
  // -----------------------------------------------
  // Verifica comandos do Python
  // -----------------------------------------------

  verificarComandoSerial();

  // -----------------------------------------------
  // Se parado
  // -----------------------------------------------

  if (!testeAtivo)
  {
    delay(20);
    return;
  }

  // -----------------------------------------------
  // ADC
  // -----------------------------------------------

  int leituraADC = analogRead(PINO_LEITURA);

  float tensao =
    (leituraADC * VCC) / ADC_MAX;

  // -----------------------------------------------
  // Tempo
  // -----------------------------------------------

  unsigned long tempoCiclo =
    millis() - tempoCicloInicio;

  // =================================================
  // CARGA
  // =================================================

  if (carregando)
  {
    digitalWrite(PINO_CARGA, HIGH);

    // -----------------------------------------------
    // PRÉ-CONDICIONAMENTO
    // -----------------------------------------------

    if (cicloPre <= CICLOS_PRE_CONDICIONAMENTO)
    {
      Serial.print("PRE,");
      Serial.print(cicloPre);
      Serial.print(",CARGA,");
      Serial.print(tempoCiclo);
      Serial.print(",");
      Serial.println(tensao, 3);

      lcd.setCursor(0, 0);
      lcd.print("PRE-CONDICION. ");

      lcd.setCursor(0, 1);
      lcd.print("C:");
      lcd.print(cicloPre);
      lcd.print("/10 CARGA ");

      // ---------------------------------------------
      // Fim da carga
      // ---------------------------------------------

      if (tensao >= TENSAO_MAX)
      {
        carregando = false;

        digitalWrite(PINO_CARGA, LOW);

        tempoCicloInicio = millis();

        lcd.clear();

        lcd.setCursor(0, 0);
        lcd.print("PRE-CONDICION.");

        lcd.setCursor(0, 1);
        lcd.print("DESCARGA");
      }
    }

    // -----------------------------------------------
    // ENSAIO EFETIVO
    // -----------------------------------------------

    else
    {
      Serial.print(cicloEfetivo);
      Serial.print(",CARGA,");
      Serial.print(tempoCiclo);
      Serial.print(",");
      Serial.println(tensao, 3);

      lcd.setCursor(0, 0);
      lcd.print("V:");
      lcd.print(tensao, 2);
      lcd.print("V       ");

      lcd.setCursor(0, 1);
      lcd.print("C:");
      lcd.print(cicloEfetivo);
      lcd.print(" CARGA   ");

      if (tensao >= TENSAO_MAX)
      {
        carregando = false;

        digitalWrite(PINO_CARGA, LOW);

        tempoCicloInicio = millis();

        lcd.clear();

        lcd.setCursor(0, 0);
        lcd.print("V:");
        lcd.print(tensao, 2);
        lcd.print("V");

        lcd.setCursor(0, 1);
        lcd.print("C:");
        lcd.print(cicloEfetivo);
        lcd.print(" DESCARGA");
      }
    }
  }

  // =================================================
  // DESCARGA
  // =================================================

  else
  {
    digitalWrite(PINO_CARGA, LOW);

    // -----------------------------------------------
    // PRÉ-CONDICIONAMENTO
    // -----------------------------------------------

    if (cicloPre <= CICLOS_PRE_CONDICIONAMENTO)
    {
      Serial.print("PRE,");
      Serial.print(cicloPre);
      Serial.print(",DESCARGA,");
      Serial.print(tempoCiclo);
      Serial.print(",");
      Serial.println(tensao, 3);

      lcd.setCursor(0, 0);
      lcd.print("PRE-CONDICION.");

      lcd.setCursor(0, 1);
      lcd.print("C:");
      lcd.print(cicloPre);
      lcd.print("/10 DESC");

      // ---------------------------------------------
      // Fim da descarga
      // ---------------------------------------------

      if (tensao <= TENSAO_MIN)
      {
        cicloPre++;

        carregando = true;

        digitalWrite(PINO_CARGA, HIGH);

        tempoCicloInicio = millis();

        lcd.clear();

        if (cicloPre <= CICLOS_PRE_CONDICIONAMENTO)
        {
          lcd.setCursor(0, 0);
          lcd.print("PRE-CONDICION.");

          lcd.setCursor(0, 1);
          lcd.print("C:");
          lcd.print(cicloPre);
          lcd.print("/10");
        }
        else
        {
          // -----------------------------------------
          // TERMINOU PRÉ-CONDICIONAMENTO
          // -----------------------------------------

          cicloEfetivo = 1;

          Serial.println("PRE_CONDICIONAMENTO_OK");

          lcd.clear();

          lcd.setCursor(0, 0);
          lcd.print("TESTE EFETIVO");

          lcd.setCursor(0, 1);
          lcd.print("Ciclo: 1");

          delay(500);

          tempoCicloInicio = millis();
        }
      }
    }

    // -----------------------------------------------
    // ENSAIO EFETIVO
    // -----------------------------------------------

    else
    {
      Serial.print(cicloEfetivo);
      Serial.print(",DESCARGA,");
      Serial.print(tempoCiclo);
      Serial.print(",");
      Serial.println(tensao, 3);

      lcd.setCursor(0, 0);
      lcd.print("V:");
      lcd.print(tensao, 2);
      lcd.print("V       ");

      lcd.setCursor(0, 1);
      lcd.print("C:");
      lcd.print(cicloEfetivo);
      lcd.print(" DESC    ");

      // ---------------------------------------------
      // FIM DO CICLO
      // ---------------------------------------------

      if (tensao <= TENSAO_MIN)
      {
        Serial.print("# FIM CICLO ");
        Serial.println(cicloEfetivo);

        cicloEfetivo++;

        carregando = true;

        digitalWrite(PINO_CARGA, HIGH);

        tempoCicloInicio = millis();

        lcd.clear();

        lcd.setCursor(0, 0);
        lcd.print("NOVO CICLO");

        lcd.setCursor(0, 1);
        lcd.print("Ciclo: ");
        lcd.print(cicloEfetivo);

        delay(300);
      }
    }
  }

  delay(50);
}
