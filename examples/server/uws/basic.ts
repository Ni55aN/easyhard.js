import { easyhardServer } from 'easyhard-server-uws';
import { BasicActionsUWS } from '../../shared'
import { getInterval } from '../shared';
import { map, mergeMap, take } from 'rxjs/operators';
import { interval } from 'rxjs';

export default easyhardServer<BasicActionsUWS>({
    getData: getInterval(),
    getIP: mergeMap((payload) => {
      return interval(500).pipe(
        take(14),
        map(count => ({ ip: String(count) + '|' + payload.$request.socket.ip }))
      )
    }),
})
