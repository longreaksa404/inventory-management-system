from django.http import HttpResponse


def home(request):
    return HttpResponse("Inventory Management Backend is running!")
