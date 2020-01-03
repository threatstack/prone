from locust import HttpLocust, TaskSet, task

class UserBehavior(TaskSet):
  @task(1)
  def list(self):
    self.client.get("/api/todo")

  @task(1)
  def create(self):
    self.client.post("/api/todo", {"content": "note from locust"})

class WebsiteUser(HttpLocust):
  task_set = UserBehavior
  host = "http://localhost:3001"
  min_wait = 1000
  max_wait = 1000