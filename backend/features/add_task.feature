
Feature: Add a new task
  As a user
  I want to add a new task to my to-do list
  So that I can track my work

  Scenario: Successfully add a task
    Given I have a title "Buy milk" and a description "Get 2% milk"
    When I send a POST request to "/api/tasks"
    Then the response status code should be 201
    And the response should contain the new task with title "Buy milk"
