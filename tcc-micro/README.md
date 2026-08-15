# tcc-micro

Serviço headless que opera o Arduino do ensaio RC e envia os dados ao `tcc-backend`.
Não importa Tkinter, Matplotlib, OpenPyXL nem cria janelas.

## Uso como comando

Com o backend e o banco iniciados pelo Docker Compose:

```powershell
docker-compose up -d db backend
pip install -r tcc-micro/requirements.txt
python tcc-micro/main.py --mode cycle --cycles 30
```

O Arduino permanece conectado ao Windows, pois a porta serial `COM5` pertence
ao host. No WSL, inicie banco, backend e frontend com:

```bash
docker compose up --build db backend frontend
```

Em outro terminal PowerShell do Windows, inicie somente a API Python:

```powershell
$env:TCC_BACKEND_URL = "http://localhost:8080"
$env:TCC_SERIAL_PORT = "COM5"
python tcc-micro/api.py
```

Na raiz do projeto, o mesmo processo pode ser iniciado pelo script:

```powershell
.\start-micro.ps1
```

Se o backend retornar `503` informando que o microserviço está inacessível,
confirme que esse processo continua aberto e teste a API no Windows:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

O resultado esperado contém `running: false`. Se o teste funcionar no Windows
mas falhar pelo frontend, permita a porta TCP 8000 no Firewall do Windows e
reinicie os containers.

O backend chama `POST /start` com `mode`, `numberCycles` ou `time` e o
microserviço executa imediatamente `RcMicroservice.start`, que envia `START`
ao Arduino. As medições continuam sendo persistidas em segundo plano. O
endpoint `PATCH /stop` envia `STOP` e finaliza o trial.

O backend e o frontend Docker encaminham as requisições para
`host.docker.internal:8000`, onde a API Python Windows acessa o Arduino. Não é
necessário anexar o USB ao WSL nem iniciar o serviço `micro` do Compose.

Para ensaio por tempo:

```powershell
python tcc-micro/main.py --mode time --minutes 10
```

Antes de conectar o Arduino, valide o fluxo usando o gerador de medições:

```powershell
python tcc-micro/main.py --simulate --cycles 3
```

O modo de simulação ainda envia os dados para o backend, mas não abre uma porta
serial. Use `TCC_SERIAL_PORT`, `TCC_BACKEND_URL`, `TCC_BAUDRATE`,
`TCC_CAPACITOR_UF` e `TCC_RESISTOR_OHM` para configurar o processo sem alterar
o código.

## Uso como biblioteca

```python
from microservice import BackendClient, MicroConfig, RcMicroservice, SerialMachine

config = MicroConfig(serial_port="COM5", backend_url="http://localhost:8080")
service = RcMicroservice(SerialMachine(config), BackendClient(config.backend_url))
service.start("CYCLE", number_cycles=30)
```

O serviço espera `ARDUINO_RC_PRONTO`, lê os metadados de capacitor, resistor e
pré-condicionamento enviados pelo firmware, ignora o cabeçalho e as linhas `PRE,...`,
e aceita apenas as medições efetivas no formato `ciclo,estado,tempo_ms,tensão`.
O comando `START` é enviado após a criação do trial; no `script.ino` atual ele é
seguro porque iniciar um ensaio já ativo não faz nada. O serviço cria o `trial`,
cria cada `cycle` na primeira medição efetiva e persiste cada `measurement` com a
tensão real lida no ADC.
Ao chamar `service.stop()` ou `service.close()`, o serviço envia `STOP` ao Arduino e
chama `PATCH /trial/{id}/finish` no backend, preenchendo `endTime` e marcando o trial
como `IDLE`.

Instalação: `pip install -r tcc-micro/requirements.txt`.