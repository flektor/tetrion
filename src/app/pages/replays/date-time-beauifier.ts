import moment from 'moment';

export const beautifyDatetime = (datetime:number): string => {

    const now = moment(new Date());

    const moment1 = moment(datetime);
 
   
    if (!moment1.isSame(now, 'year')) { 
        return moment(datetime).format('l, h:mm a');
    }

    if (!moment1.isSame(now, 'month')) {
        return moment(datetime).format('MMMM D, h:mm a');
    }
    if (!moment1.isSame(now, 'day')) {
        return moment1.format('ddd. h:mm a');
    }

    return moment1.format('h:mm a');
}

export const beautifyTime = (time: number, accuracy?: 'hrs' | 'min' | 'sec' | 'ms'): string => {

    const duration = moment.duration(time); 
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();
    // const milliseconds = duration.milliseconds();
  
    let stringTime: string = '';

    let addColon: boolean = false;
    if (hours) {
        stringTime += hours;
        addColon = true;
    }

    if (minutes) {
        stringTime += addColon ? '.' : '';
        stringTime += addColon && minutes < 9 ? '0' : '';
        stringTime += minutes;
        addColon = true;
    } else {
        stringTime += hours ? '.00' : '';
    }

    if (seconds) {
        stringTime += addColon ? '.' : '';
        stringTime += addColon && seconds < 9 ? '0' : '';
        stringTime += seconds;
        addColon = true;
    } else {
        stringTime += minutes ? '.00' : '';
    }

    // if (milliseconds) {
    //     stringTime += addColon ? ':' : '';
    //     stringTime += milliseconds;
    // }

    if (hours) {
        stringTime += ' hrs';
    } else if (minutes) {
        stringTime += ' min';
    } else if (seconds) {
        stringTime += ' sec';
    } 
    // else if (milliseconds) {
    //     stringTime += ' ms';
    // }

 
    // if (accuracy) {
    //     stringTime = getAccuracy(stringTime, accuracy);
    // }

    return stringTime;
}


// const getAccuracy = (stringTime: string, accuracy: 'hrs' | 'min' | 'sec' | 'ms') => {

//     const array2: any[] =  stringTime.split(' ')[0].split(':');
//     const format =  stringTime.split(' ')[1];

//     console.log({
//         stringTime: stringTime,
//         format:format, 
//         array2:array2,
//     })


//     switch (accuracy) {
//         case 'hrs':

//             switch (format) {
//                 case 'hrs':
//                     return stringTime;
//                 case 'min':
//                     return '0:' + array2[0] + ' hrs';
//                 case 'sec':
//                     return '0:00:' + array2[0] + ' hrs';
//                 case 'ms':
//                     return '0:00:00:' + array2[0] + ' hrs';
//             }


//         case 'min':

//             switch (format) {

//                 case 'hrs':
//                     return 60 * array2[0] + ' min';
//                 case 'min':
//                     return stringTime;
//                 case 'sec':
//                     return '0:' + array2[0] + ' min';
//                 case 'ms':
//                     return '0:00:' + array2[0] + ' min';
//             }


//         case 'sec':

//             switch (format) {

//                 case 'hrs':
//                     return 3600 * array2[0] + 60 * array2[1] + array2[2] + ' sec';
//                 case 'min':
//                     return 60 * array2[0] + array2[1] + ' sec';
//                 case 'sec':
//                     return stringTime;
//                 case 'ms':
//                     return 1000 * array2[0] + ' sec';
//             }


//         case 'ms':

//             switch (format) {

//                 case 'hrs':
//                     return 3600000 * array2[0] + 60000 * array2[1] + 1000 * array2[2] + array2[3] + ' ms';
//                 case 'min':
//                     return 60000 * array2[0] + 1000 * array2[1] + array2[2] + ' ms';
//                 case 'sec':
//                     return  array2[0] + array2[1] + ' ms';
//                 case 'ms':
//                     return stringTime;
//             }


//     }
// }



//testing time


 