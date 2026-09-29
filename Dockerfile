FROM maven:3.9.11-eclipse-temurin-25 AS builder

WORKDIR /workspace

COPY pom.xml mvnw ./
COPY .mvn .mvn
COPY src src

RUN chmod +x mvnw && \
    mvn -q -DskipTests package

FROM eclipse-temurin:25-jre-alpine

WORKDIR /app

ENV SERVER_PORT=8080

COPY --from=builder /workspace/target/PageTurner-0.0.1-SNAPSHOT.jar /app/app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]