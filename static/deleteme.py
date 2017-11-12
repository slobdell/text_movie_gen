
import os

for fname in os.listdir("./images"):
    os.system("rm ./images/%s" % fname)
    print "rm ./images/%s" % fname
