import csv
import copy
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

#meridian reference
meridians = {"1st PM":1,"2nd PM":2,"3rd PM":3,"4th PM - 1815 Illinois":4,"5th PM":5,"6th PM":6,"Black Hills":7,"Boise":8,"Chickasaw":9,"Choctaw":10,"Cimarron":11,"Gila-Salt River":14,"Humboldt":15,"Huntsville":16,"Indian":17,"Louisiana":18,"Michigan-Toledo Strip":19,"Montana PM":20,"Mount Diablo":21,"New Mexico":23,"New Mexico PM":23,"St Helena":24,"St Stephens":25,"Salt Lake":26,"San Bernardino":27,"Tallahassee":29,"Uintah":30,"Ute":31,"Washington":32,"Willamette":33,"Wind River":34,"4th PM - 1831 MN/WI":46}
#counties by state 
states = {"AL":67, "AK":30, "AZ":15,"AR":75,"CA":58,"CO":64,"CT":8,"DE":3,"FL":67,"GA":159,"HI":5,"ID":44,"IL":102,"IN":92,"IA":99,"KS":105,"KY":120,"LA":64,"ME":16,"MD":24,"MA":14,"MI":83,"MN":87,"MS":82,"MO":115,"MT":56, "NE":93, "NV":16, "NH":10, "NJ":21, "NM":33, "NY":62, "NC":100, "ND":53, "OH":88, "OK":77, "OR":36, "PA":67, "RI":5, "SC":46, "SD":66, "TN":95, "TX":254, "UT":29, "VT":14, "VA":133, "WA":39, "WV":55, "WI":72,"WY":23}
#253000 Allotment
#253410
def webIterate():
    #state abbreviation
    st = input("Enter a state (please its 2-letter postal abbrevation. i.e. Wisconsin would be WI)")
    st = st.upper()
    #starting county    
    startCnty = 1
    #number of counties
    cnty = states[st] * 2
    #land patent legislation
    aut = input("Enter Title Transfer Authority (ex. the Homestead Act is 251101). A list can be found here: https://glorecords.blm.gov/reference/default.aspx#id=05_Appendices|03_Title_Transfer_Authorities)")
    #get type of scraping, state, county, or section level
    scrapeType = input("How detailed of a search do you want? The GLO website limits the amount of search results for a given geograph to 900. 1 = Highly detailed. For use if you are searching for an authority with many parcels. 2 = County level. For use if you are searching for an authority with less than 900 parcels per county. 3 = State Level. For use if you are searching for an authority with less than 900 parcels in the whole state.")
    scrapeType = int(scrapeType)
    #web driver
    driver = webdriver.Firefox()
    #set file name
    fileName = st + '_parcels'
    #create new CSV document
    with open(fileName + ".csv", 'w') as csvfile:
        #iteration function
        def iterator(address):
            try:
                prevRecord = []
                #go to address and wait a second for the page to load
                driver.get(address)
                WebDriverWait(driver, 1).until(EC.visibility_of_element_located((By.CLASS_NAME, "resultsPF"))) 
                #get rows
                row = driver.find_elements(By.TAG_NAME,"tr")
                #iterate through each row
                for r in row:
                    record = []
                    #skip first row
                    if row.index(r) > 0:
                        #get list of cells in each row
                        cell = r.find_elements(By.TAG_NAME,"td")
                        link = ""
                        #iterate through each cell
                        for c in cell:
                            #for records with multiple land areas, combine info from previous records
                            if cell[0].text == ' ':
                                record = prevRecord
                                record[6] = cell[2].text #township/range
                                record[7] = cell[3].text #section
                                record[8] = cell[4].text #parcels
                                record[9] = cell[5].text.replace(",",";") #county(ies)
                                break
                            #for the initial row of the record, fill every cell
                            else:
                                #replace commas with semicolons in the name, county, and aliquot cell
                                if cell.index(c) == 1 or cell.index(c) == 9 or cell.index(c) == 7:
                                    record.append(c.text.replace(",",";").replace('\n', ' '))
                                else:
                                    #add cell text
                                    record.append(c.text)
                                #check the accession link
                                try:
                                    link = c.find_element(By.TAG_NAME, 'a').get_attribute("href")
                                except:
                                    print("no link")
                        #add link for the initial record
                        if link != "":
                            record.append(link)
                        prevRecord = record
                        #print(record)
                        #write row to CSV
                        #if record has blank aliquot don't record
                        if record[7] != ' ':
                            filewriter.writerow(record) 
                        else:
                            record[7] = 'All'
                            filewriter.writerow(record) 
                        #add authority code
                    #record.append(aut)
            except:
                print("no record")
        #set CSV options
        filewriter = csv.writer(csvfile, delimiter=',',
                        quotechar='"', quoting=csv.QUOTE_MINIMAL)
        #create header row based on the GLO attributes
        filewriter.writerow(["Accession","Name","Date","Doc","State","Meridian","TwpRng","Aliquots","Sec","County","Link","Authority"])
        #if scraping at the state level, get parcels for the state
        if scrapeType == 3:
            address = "https://glorecords.blm.gov/results/default_pf.aspx?searchCriteria=type=patent|st=" + st + "|cty=|aut=" + aut + "|sp=true|sw=true|sadv=false"
            print(address)
            iterator(address)
        else:
            #iterate through each county
            for i in range(startCnty,cnty,2):
                #get correct county value based on number of digits
                if i < 10:
                    cty_value = '00' + str(i)
                elif i >= 10 and i < 100:
                    cty_value = '0' + str(i)
                else:
                    cty_value = str(i)
                if scrapeType == 1:
                    #iterate through each section of the county
                    for j in range(1,37,1):
                        sec = str(j)
                        address = "https://glorecords.blm.gov/results/default_pf.aspx?searchCriteria=type=patent|st=" + st + "|cty=" + cty_value + "|sec=" + sec + "|aut=" + aut + "|sp=true|sw=true|sadv=false"
                        iterator(address)
                #iterate through each county
                if scrapeType == 2:
                    address = "https://glorecords.blm.gov/results/default_pf.aspx?searchCriteria=type=patent|st=" + st + "|cty=" + cty_value + "|aut=" + aut + "|sp=true|sw=true|sadv=false"
                    iterator(address)
    #close browser
    driver.quit() 
    parcelParser(fileName, aut)  
#parse parcels after they are scraped
def parcelParser(fileName, aut):
    f=open(fileName + ".csv","r")
    header=f.readline()
    error = 0
    docList = []
    totRecords = 0
    parcelList = []
    family = 0
    for i, line in enumerate(f):
        record=line.strip().split(",") # get the record (a list of string)
        #print(record)
        #get quarter section
        match record[7][-3:]:
            case "All":
                record.append([1,2,3,4])
            case "NE¼":
                record.append([1])
            case "NW¼":
                record.append([2])
            case "SW¼":
                record.append([3])
            case "SE¼":
                record.append([4])
            case _:
                match record[7][-2:]:
                    case "N½":
                        record.append([1,2])
                    case "E½":
                        record.append([1,4])
                    case "S½":
                        record.append([3,4])
                    case "W½":
                        record.append([2,3])
                    case _:
                        match record[7]:
                            case "N½":
                                record.append([1,2])
                            case "E½":
                                record.append([1,4])
                            case "S½":
                                record.append([3,4])
                            case "W½":
                                record.append([2,3])
                            case _:
                                record.append([0])
                                error+=1
        #government lots with "lot" in the name
        try: 
            if "Lot" in record[7] or len(record[7]) == 1:
                record.pop(11)
                record.append([5])
        except:
            record[11] = record[11]
        #government lot with single character 
        #if (len(record[7]) == 1):
        #    record.pop(10)
        #    record.append(5)
        #get quarter subsection
        #entire quarter section
        if (len(record[7]) == 3):
            record.append([1,2,3,4])
        #single digital government lots
        elif (len(record[7]) == 1):
            record.append(record[7])
        #government lots
        elif ';' in record[7]:
            l = record[7].split(';')[1]
            a = record[7].split(';')[0]
            lot = [int(s) for s in l.split() if s.isdigit()]
            record.append([lot[0]])
            record[7] = a + 'NN¼SN¼'
        elif 'Lot' in record[7]:
            if '.5' not in record[7]:
                lot = [int(s) for s in record[7].split() if s.isdigit()]
                record.append([lot[0]])
            else:
                record.append([0])
        #small parcels
        elif (len(record[7]) > 6) and 'Lot' not in record[7]:
            #for small parcels
            if record[7][:-3][-1:] == "¼":
                match record[7][:-3][-3:]:
                    case "NE¼":
                        record.append([1])
                    case "NW¼":
                        record.append([2])
                    case "SW¼":
                        record.append([3])
                    case "SE¼":
                        record.append([4])
                    case _:
                        record.append([0])
            elif record[7][:-3][-1:] == "½":
                match record[7][:-3][-2:]:
                    case "E½":
                        record.append([1,4])
                    case "N½":
                        record.append([1,2])
                    case "S½":
                        record.append([3,4])
                    case "W½":
                        record.append([2,3])
                    case _:
                        record.append([0])
            else:
                record.append([0])  
        else:
            match record[7][:-3]:
                case "NE¼":
                    record.append([1])
                case "NW¼":
                    record.append([2])
                case "SW¼":
                    record.append([3])
                case "SE¼":
                    record.append([4])
                case "E½":
                    record.append([1,4])
                case "N½":
                    record.append([1,2])
                case "S½":
                    record.append([3,4])
                case "W½":
                    record.append([2,3])
                case _:
                    #when half of a half section
                    match record[7][:-2]:
                        case "E½":
                            record.append([1,4])
                        case "N½":
                            record.append([1,2])
                        case "S½":
                            record.append([3,4])
                        case "W½":
                            record.append([2,3])
                        case _:
                            match record[7]:
                                case "N½":
                                    record.append([1,2,3,4])
                                case "E½":
                                    record.append([1,2,3,4])
                                case "S½":
                                    record.append([1,2,3,4])
                                case "W½":
                                    record.append([1,2,3,4])
                                case _:
                                    record.append([0])
        parcelList.append(record)

    #create new record for each quarter of a quarter parcel
    sectionList = [] 
    for record in parcelList:
        if record[0] in docList:
            totRecords = totRecords
        else:
            docList.append(record[0])
            totRecords += 1
        for j, qua in enumerate(record[11]):
            for i, sec in enumerate(record[12]):
                #count unique accession numbers
                temp = copy.deepcopy(record)
                temp.append(sec)
                temp.pop(12)
                #will need to get specific meridian and add to the concatenation
                #meridian, twp dir,rng dir, twp, rng, sec, qua, squar
                #example: 4_N_W_46_1_2_2_1
                temp.append(aut)
                try:
                    temp.append(str(meridians[record[5]]) + "_" + str(record[6][3]) + "_" + str(record[6][10]) + "_" + str(int(record[6][0:3])) + "_" + str(int(record[6][7:10])) + "_" + str(temp[8]) + "_" + str(temp[11][j]) + "_" + str(temp[12]))
                    print(temp)
                except:
                    temp.append("Error")
                #get section location
                #temp.append(str(temp[10]) + "_" + str(temp[11]) + "_" + str(temp[12]) + "_" + str(temp[8]))
                sectionList.append(temp)

    with open(fileName + "_" + aut +'_edited.csv', 'w') as csvfile:
        filewriter = csv.writer(csvfile, delimiter=',',
                        quotechar='"', quoting=csv.QUOTE_MINIMAL)
        filewriter.writerow(["Accession","Name","Date","Doc","State","Meridian","TwpRng","Aliquots","Sec","County","Link","Qua","SubQ","Authority","Loc_code"])
        print(totRecords)
        print(len(sectionList))
        for record in sectionList:
            filewriter.writerow(record)
#run scraper
webIterate()

