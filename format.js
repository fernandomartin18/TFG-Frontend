const fs = require('fs');

const content = fs.readFileSync('/Users/fer/Desktop/Uni/4 Curso/x TFG/app/backend/src/db/schema.sql', 'utf-8');
const searchBlock = `-- =====================================================\n-- DATOS POR DEFECTO (SEMILLAS PLANTUML)\n-- =====================================================`;
const prefixIndex = content.indexOf(searchBlock);
const prefix = content.substring(0, prefixIndex + searchBlock.length + 1);

const templates = [
  {
    title: 'Arquitectura Híbrida',
    code: `@startuml
!theme plain
' Mostrar íconos estándar de visibilidad (+, -, #)
skinparam classAttributeIconSize 0

title Diagrama de Clases: Arquitectura Híbrida (Clásico-Cuántica)

' --- Dominio Clásico (Front-end / Controlador) ---
package "Dominio Clásico" {
    
    class "ClassicalAppController" <<Classical>> {
        - quantumService: IQuantumOptimizationService
        + runOptimization(): ResultDTO
    }

    interface "IQuantumOptimizationService" <<Classical Interface>> {
        + solve(problem: ProblemParams): ResultData
    }

    class "QuantumOptimizationService" <<Classical Service>> {
        - quantumBackend: IQuantumBackend
        - classicalOptimizer: IClassicalOptimizer
        + solve(problem: ProblemParams): ResultData
    }

    class "ResultDTO" <<Classical DTO>> {
        + solution: Map<String, Double>
        + objectiveValue: double
    }

    class "ProblemParams" <<Classical DTO>> {
        + constraint Matrix: double[][]
        + penaltyFactor: double
    }

    interface "IClassicalOptimizer" <<Classical Interface>> {
        + optimize(parameters: double[]): double[]
    }

    class "GradientDescentOptimizer" <<Classical Service>> {
        + optimize(parameters: double[]): double[]
    }
}


' --- Interfaz de Comunicación Clásico-Cuántica (Quantum SDK) ---
package "Abstracción Cuántica (Interoperabilidad)" {
    
    interface "IQuantumBackend" <<Classical Interface>> {
        + prepareCircuit(data: ProblemParams): CircuitDefinition
        + execute(circuit: CircuitDefinition, params: double[]): QuantumResult
    }

    class "CircuitDefinition" <<Classical DTO>> {
        + numQubits: int
        + gates: List<GateOperation>
    }

    class "QuantumResult" <<Classical DTO>> {
        + countMap: Map<String, int>
        + shots: int
    }
}


' --- Dominio Cuántico (Back-end / Circuito) ---
package "Dominio Cuántico" {
    
    class "VariationalQuantumCircuit" <<Quantum>> {
        - parameters: double[]
        - registers: QubitRegister
        + run(): QuantumResult
    }

    class "QubitRegister" <<Quantum>> {
        - numQubits: int
        + getState(): QuantumState
    }

    enum "GateOperation" <<Quantum Enum>> {
        RX
        RY
        RZ
        CNOT
    }

    ' Stereotipos específicos para el dominio cuántico
    annotation "Entangled" <<Entangled Qubits>> {
    }
}


' --- Relaciones y Flujos ---

' Capa Clásica
ClassicalAppController --> IQuantumOptimizationService : "Inyecta"
ClassicalAppController ..> ResultDTO : "Retorna"

QuantumOptimizationService ..|> IQuantumOptimizationService : "Implementa"
QuantumOptimizationService --> IQuantumBackend : "Inyecta"
QuantumOptimizationService --> IClassicalOptimizer : "Usa para variacional"
QuantumOptimizationService ..> ProblemParams : "Usa para preparacion"

GradientDescentOptimizer ..|> IClassicalOptimizer : "Implementa"

' Capa de Interoperabilidad
IQuantumBackend ..> CircuitDefinition : "Define"
IQuantumBackend ..> QuantumResult : "Retorna"

' Capa Cuántica
VariationalQuantumCircuit --> CircuitDefinition : "Basado en"
VariationalQuantumCircuit *-- QubitRegister : "Opera sobre"
QubitRegister ..> GateOperation : "Usa"

' Relación entre dominios (puente)
QuantumOptimizationService ..> VariationalQuantumCircuit : "Instancia para el Backend"
QuantumOptimizationService ..> QuantumResult : "Convierte resultados"

@enduml`
  },
  {
    title: 'Arquitectura de 3 Capas',
    code: `@startuml
!theme plain
' Mostrar íconos estándar de visibilidad (+, -, #)
skinparam classAttributeIconSize 0

title Diagrama de Clases: Arquitectura de 3 Capas

package "Capa de Presentación" {
    class UserController {
        - userService: IUserService
        + getUser(id: int): UserDTO
        + createUser(dto: UserDTO): void
    }
    class UserDTO <<DTO>> {
        + id: int
        + name: String
    }
}

package "Capa de Negocio" {
    interface IUserService <<Interface>> {
        + getUser(id: int): User
        + createUser(user: User): void
    }
    class UserService {
        - userRepository: IUserRepository
        + getUser(id: int): User
        + createUser(user: User): void
    }
    class User <<Entity>> {
        - id: int
        - name: String
        - email: String
        + isValid(): boolean
    }
}

package "Capa de Datos" {
    interface IUserRepository <<Interface>> {
        + findById(id: int): User
        + save(user: User): void
    }
    class UserRepositoryImpl {
        - dbConnection: Connection
        + findById(id: int): User
        + save(user: User): void
    }
}

' Relaciones de Inyección de Dependencias y Uso
UserController --> IUserService : "Inyecta"
UserController ..> UserDTO : "Usa"

UserService ..|> IUserService : "Implementa"
UserService --> IUserRepository : "Inyecta"
UserService ..> User : "Gestiona"

UserRepositoryImpl ..|> IUserRepository : "Implementa"
UserRepositoryImpl ..> User : "Instancia"

@enduml`
  },
  {
    title: 'Microservicios',
    code: `@startuml
!theme plain
skinparam classAttributeIconSize 0

title Diagrama de Clases: Dominio de un Microservicio

package "Bounded Context: Order Service" {
    
    ' Capa de entrada (API / Controladores)
    class OrderController <<REST API>> {
        - orderService: OrderService
        + createOrder(request: OrderRequestDTO): ResponseEntity
    }
    class OrderRequestDTO <<DTO>> {
        + customerId: String
        + items: List<String>
    }

    ' Lógica de Dominio
    class OrderService <<Service>> {
        - repository: OrderRepository
        - eventPublisher: EventPublisher
        + processOrder(dto: OrderRequestDTO): void
    }
    class Order <<Aggregate Root>> {
        - orderId: String
        - status: OrderStatus
        - totalAmount: double
        + calculateTotal(): void
        + markAsPaid(): void
    }
    enum OrderStatus <<Enum>> {
        PENDING
        PAID
        SHIPPED
    }

    ' Persistencia
    interface OrderRepository <<Repository>> {
        + save(order: Order): void
        + findById(id: String): Order
    }

    ' Comunicación Hacia Afuera (Mensajería)
    interface EventPublisher <<Interface>> {
        + publish(event: DomainEvent): void
    }
    class OrderCreatedEvent <<Event>> {
        + eventId: String
        + orderId: String
        + timestamp: Date
    }

    ' --- Relaciones internas del microservicio ---
    OrderController --> OrderService
    OrderController ..> OrderRequestDTO
    
    OrderService --> OrderRepository
    OrderService --> EventPublisher
    OrderService *-- Order : "Crea / Modifica"
    Order *-- OrderStatus
    
    EventPublisher ..> OrderCreatedEvent : "Emite"
}

' Simulando la frontera hacia otros servicios
package "Shared / Message Broker" #F8F9FA {
    class MessageQueue <<Kafka/RabbitMQ>> {
    }
    OrderCreatedEvent ..> MessageQueue : "Se envía a"
}

@enduml`
  }
];

const lines = ['INSERT INTO plantuml_templates (user_id, title, code) VALUES'];
for (let i = 0; i < templates.length; i++) {
  const t = templates[i];
  const stringified = t.code.replace(/'/g, "''").replace(/\n/g, '\\n');
  const line = `(NULL, '${t.title}', E'${stringified}')${i === templates.length - 1 ? ';' : ','}`;
  lines.push(line);
}

const finalScript = prefix + lines.join('\n') + '\n';
fs.writeFileSync('/Users/fer/Desktop/Uni/4 Curso/x TFG/app/backend/src/db/schema.sql', finalScript);
console.log('Done!');
