# Stage 1: Build with Maven
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Production runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring

# Copy the built JAR regardless of exact version/artifactId
COPY --from=build --chown=spring:spring /app/target/*.jar ./auth-service.jar

USER spring
EXPOSE 8081

ENTRYPOINT ["java", "-jar", "auth-service.jar"]